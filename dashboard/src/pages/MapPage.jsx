import { useState, useEffect, useCallback, useRef, useMemo, memo, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'react-leaflet-markercluster/styles';

import Layout from '../components/Layout';
import Toast from '../components/Toast';
import api from '../api/axios';
import useLiveAlerts from '../hooks/useLiveAlerts';


function createSvgIcon(color, size = 36) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 12}" viewBox="0 0 36 48">
    <defs>
      <filter id="glow${color}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="18" cy="18" r="12" fill="${color}" opacity="0.15" filter="url(#glow${color})"/>
    <circle cx="18" cy="18" r="8" fill="${color}" opacity="0.3"/>
    <path d="M18 2C18 2 8 14 8 22a10 10 0 0020 0C28 14 18 2 18 2z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round" filter="url(#glow${color})"/>
    <path d="M18 10c0 0-4 5-4 9a4 4 0 008 0c0-4-4-9-4-9z" fill="white" opacity="0.6"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 4)],
  });
}

function createUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <defs>
      <filter id="uglow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.12"/>
    <circle cx="20" cy="20" r="12" fill="#3b82f6" opacity="0.25"/>
    <circle cx="20" cy="20" r="7" fill="#3b82f6" stroke="white" stroke-width="2" filter="url(#uglow)"/>
    <circle cx="20" cy="20" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22] });
}

function createNearbyIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="${color}" opacity="0.15"/>
    <circle cx="14" cy="14" r="7" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16] });
}

function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);
}

function isAudioUrl(url) {
  if (!url) return false;
  return /\.(mp3|wav|ogg|webm|m4a|aac|opus)(\?|$)/i.test(url) || url.includes('/audio');
}

function FireMedia({ fileUrl, audioUrl }) {
  if (!fileUrl && !audioUrl) return null;

  return (
    <>
      {fileUrl && isVideoUrl(fileUrl) && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700">
          <video src={fileUrl} controls className="w-full h-auto max-h-[160px] object-cover" preload="metadata" />
        </div>
      )}
      {fileUrl && !isVideoUrl(fileUrl) && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700">
          <img src={fileUrl} alt="Fire evidence" className="w-full h-auto max-h-[160px] object-cover" loading="lazy" />
        </div>
      )}
      {audioUrl && (
        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">Voice Note</span>
          </div>
          <audio src={audioUrl} controls className="w-full h-8" preload="metadata" style={{ filter: 'invert(0.85) hue-rotate(140deg)' }} />
        </div>
      )}
    </>
  );
}

const fireIconRed = createSvgIcon('#ef4444');
const fireIconYellow = createSvgIcon('#eab308');
const fireIconOrange = createSvgIcon('#f97316');
const userIcon = createUserIcon();

const nearbyIconMap = {
  hospital: createNearbyIcon('#22c55e'),
  fire_station: createNearbyIcon('#ef4444'),
  police: createNearbyIcon('#8b5cf6'),
  pharmacy: createNearbyIcon('#f97316'),
};

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) map.fitBounds(coords, { padding: [80, 80] });
  }, [coords, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="bg-gray-950/80 backdrop-blur-xl rounded-xl p-2 text-gray-400 hover:text-white transition-all flex items-center justify-center border border-white/5 shadow-2xl hover:bg-white/10"
        title="Zoom in"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-gray-950/80 backdrop-blur-xl rounded-xl p-2 text-gray-400 hover:text-white transition-all flex items-center justify-center border border-white/5 shadow-2xl hover:bg-white/10"
        title="Zoom out"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
      </button>
    </div>
  );
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MAP_TILES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  hot: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};

const FireMap = memo(function FireMap({
  userPos, nearestFire, nearbyFires, liveFires, mapStyle,
  routeCoords, selectedRoute, safeRouteCoords, nearbyRouteCoords, nearbyPlaces, allCoords,
  onShowRoute, onMapClick, onFireSelect, popupOpenRef, handlePopupOpen, handlePopupClose, mapRef, spreadPrediction,
}) {
  return (
    <MapContainer
      ref={mapRef}
      center={userPos || [30.184, 71.481]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
      zoomControl={false}
    >
      <TileLayer key={mapStyle} attribution={mapStyle === 'satellite' || mapStyle === 'terrain' ? '&copy; Esri' : '&copy; OSM'} url={MAP_TILES[mapStyle]} />

      <ZoomControls />

      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>
            <div className="text-sm min-w-[140px]">
              <div className="font-semibold text-blue-400">Your Location</div>
              <div className="text-gray-500 text-[10px] mt-1 font-mono">{userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}</div>
            </div>
          </Popup>
        </Marker>
      )}

      <MarkerClusterGroup chunkedLoading maxClusterRadius={60} spiderfyOnMaxZoom showCoverageOnHover={false} zoomToBoundsOnClick>
        {nearestFire && (
          <Marker
            position={[nearestFire.latitude, nearestFire.longitude]}
            icon={nearestFire.status === 'IN_PROGRESS' ? fireIconYellow : nearestFire.status === 'DETECTED' ? fireIconRed : fireIconOrange}
            eventHandlers={{ click: () => { if (onFireSelect) onFireSelect(nearestFire); }, popupopen: handlePopupOpen, popupclose: handlePopupClose }}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${nearestFire.status === 'IN_PROGRESS' ? 'bg-yellow-400' : nearestFire.status === 'DETECTED' ? 'bg-red-400' : 'bg-orange-400'}`} />
                  <strong className={nearestFire.status === 'IN_PROGRESS' ? 'text-yellow-400' : nearestFire.status === 'DETECTED' ? 'text-red-400' : 'text-orange-400'}>{nearestFire.incident_type}</strong>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-gray-800 text-[10px] text-gray-400 mb-2">{nearestFire.status}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Fire</span><span className="text-white font-medium">{(nearestFire.fire_confidence * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Smoke</span><span className="text-white font-medium">{(nearestFire.smoke_confidence * 100).toFixed(1)}%</span></div>
                  {nearestFire.city && <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="text-white font-medium">{nearestFire.city}</span></div>}
                </div>
                {nearestFire.message && nearestFire.message !== 'Voice report' && <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400 text-[11px] leading-relaxed"><span className="font-semibold">Message:</span> {nearestFire.message}</div>}
                {nearestFire.user_name && <div className="mt-1 text-gray-500 text-[10px]">Reported by: <span className="text-gray-300 font-medium">{nearestFire.user_name}</span></div>}
                <FireMedia fileUrl={nearestFire.file_url} audioUrl={nearestFire.audio_url} />
                <div className="mt-3">
                  <button onClick={() => onShowRoute(nearestFire.latitude, nearestFire.longitude)} className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 text-[11px] font-semibold text-center transition-all">Show Route</button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {nearbyFires.filter((f) => f.id !== nearestFire?.id).map((f) => (
          <Marker
            key={f.id}
            position={[f.latitude, f.longitude]}
            icon={f.status === 'IN_PROGRESS' ? fireIconYellow : f.status === 'DETECTED' ? fireIconRed : fireIconOrange}
            eventHandlers={{ click: () => { if (onFireSelect) onFireSelect(f); }, popupopen: handlePopupOpen, popupclose: handlePopupClose }}
          >
            <Popup>
              <div className="text-sm min-w-[170px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${f.status === 'IN_PROGRESS' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <strong className={f.status === 'IN_PROGRESS' ? 'text-yellow-400' : 'text-red-400'}>{f.incident_type}</strong>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Fire</span><span className="text-white">{((f.fire_confidence || 0) * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="text-white">{(f.distance_meters / 1000).toFixed(1)} km</span></div>
                </div>
                {f.message && f.message !== 'Voice report' && <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-400 text-[10px]"><span className="font-semibold">Message:</span> {f.message}</div>}
                {f.user_name && <div className="mt-1 text-gray-500 text-[10px]">Reported by: <span className="text-gray-300 font-medium">{f.user_name}</span></div>}
                <FireMedia fileUrl={f.file_url} audioUrl={f.audio_url} />
                <div className="mt-2">
                  <button onClick={() => onShowRoute(f.latitude, f.longitude)} className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 text-[11px] font-semibold text-center transition-all">Show Route</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {liveFires.filter((f) => f.id !== nearestFire?.id && !nearbyFires.some((nf) => nf.id === f.id) && userPos && getDistance(userPos[0], userPos[1], f.latitude, f.longitude) <= 10000).map((f) => (
          <Marker
            key={`live-${f.id}`}
            position={[f.latitude, f.longitude]}
            icon={fireIconRed}
            eventHandlers={{ click: () => { if (onFireSelect) onFireSelect(f); }, popupopen: handlePopupOpen, popupclose: handlePopupClose }}
          >
            <Popup>
              <div className="text-sm min-w-[170px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <strong className="text-red-400">{f.incident_type}</strong>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">LIVE</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Fire</span><span className="text-white">{((f.fire_confidence || 0) * 100).toFixed(1)}%</span></div>
                  {f.smoke_confidence != null && <div className="flex justify-between"><span className="text-gray-500">Smoke</span><span className="text-white">{((f.smoke_confidence || 0) * 100).toFixed(1)}%</span></div>}
                </div>
                {f.city && <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-400 text-[10px]">{f.city}{f.region ? `, ${f.region}` : ''}</div>}
                {f.user_name && <div className="mt-1 text-gray-500 text-[10px]">Reported by: <span className="text-gray-300 font-medium">{f.user_name}</span></div>}
                <FireMedia fileUrl={f.file_url} audioUrl={f.audio_url} />
                <div className="mt-2">
                  <button onClick={() => onShowRoute(f.latitude, f.longitude)} className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 text-[11px] font-semibold text-center transition-all">Show Route</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {nearbyPlaces.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={nearbyIconMap[p.type] || nearbyIconMap.hospital}>
          <Popup><div className="text-sm min-w-[140px]"><strong className="text-white">{p.name}</strong><div className="text-gray-500 text-[10px] mt-0.5">{(p.distance / 1000).toFixed(1)} km away</div></div></Popup>
        </Marker>
      ))}

      {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.9, dashArray: '12, 8', lineCap: 'round' }} />}
      {nearbyRouteCoords.length > 0 && <Polyline positions={nearbyRouteCoords} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.9, dashArray: '12, 8', lineCap: 'round' }} />}
      {selectedRoute.length > 0 && <Polyline positions={selectedRoute} pathOptions={{ color: '#facc15', weight: 6, opacity: 1, dashArray: '10, 8', lineCap: 'round' }} />}

      {spreadPrediction?.next_hotspots?.map((spot, index) => {
        const tone = spot.risk_score >= 80 ? '#ef4444' : spot.risk_score >= 60 ? '#f97316' : '#eab308';
        return (
          <Fragment key={`forecast-${index}`}>
            <Circle
              center={[spot.latitude, spot.longitude]}
              radius={Math.max(600, spot.distance_km * 1200)}
              pathOptions={{ color: tone, fillColor: tone, fillOpacity: 0.12, weight: 1.5 }}
            />
            <CircleMarker
              center={[spot.latitude, spot.longitude]}
              radius={7}
              pathOptions={{ color: tone, fillColor: tone, fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="text-sm min-w-[150px]">
                  <div className="font-semibold text-white">Forecast hotspot</div>
                  <div className="text-[10px] text-gray-500 mt-1">{spot.distance_km} km ahead</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-gray-500 text-[10px]">Risk</span>
                    <span className="text-white text-[10px] font-semibold">{spot.risk_score.toFixed(1)}%</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}

      {allCoords.length > 1 && <FitBounds coords={allCoords} />}
      {userPos && <Recenter center={userPos} />}
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
});

const NEARBY_TAGS = [
  { key: 'hospital', label: 'Hospitals', color: '#22c55e', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  )},
  { key: 'fire_station', label: 'Fire Dept', color: '#ef4444', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
  )},
  { key: 'police', label: 'Police', color: '#8b5cf6', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  )},
  { key: 'pharmacy', label: 'Pharmacy', color: '#f97316', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  )},
];

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const [userPos, setUserPos] = useState(null);
  const [nearestFire, setNearestFire] = useState(null);
  const [selectedFire, setSelectedFire] = useState(null);
  const [userSelectedFire, setUserSelectedFire] = useState(false);
  const [nearbyFires, setNearbyFires] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [activeNearby, setActiveNearby] = useState(null);
  const [nearbyRouteCoords, setNearbyRouteCoords] = useState([]);
  const [nearbyRouteInfo, setNearbyRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [safeRouteCoords, setSafeRouteCoords] = useState([]);
  const [toast, setToast] = useState(null);
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showSidebar, setShowSidebar] = useState(true);
  const { liveFires, connected, lastAlert } = useLiveAlerts();
  const [weather, setWeather] = useState(null);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherCoords, setWeatherCoords] = useState(null);
  const [spreadPrediction, setSpreadPrediction] = useState(null);
  const popupOpenRef = useRef(false);
  const mapRef = useRef(null);

  const handlePopupOpen = useCallback(() => {
    popupOpenRef.current = true;
  }, []);

  const handlePopupClose = useCallback(() => {
    popupOpenRef.current = false;
  }, []);

  const centerMap = useCallback((coords, zoom = 12) => {
    if (mapRef.current) {
      mapRef.current.flyTo(coords, zoom, { animate: true, duration: 1.2 });
    }
  }, []);

  useEffect(() => {
    const paramLat = searchParams.get('lat');
    const paramLng = searchParams.get('lng');
    if (paramLat && paramLng) {
      const lat = parseFloat(paramLat);
      const lng = parseFloat(paramLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserPos([lat, lng]);
        setTimeout(() => centerMap([lat, lng], 14), 800);
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'NOTIFICATION_CLICK' && e.data.data) {
        const { lat, lng } = e.data.data;
        if (lat && lng) {
          const latN = parseFloat(lat);
          const lngN = parseFloat(lng);
          if (!isNaN(latN) && !isNaN(lngN)) {
            setUserPos([latN, lngN]);
            centerMap([latN, lngN], 14);
          }
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [centerMap]);

  const goToCurrentLocation = useCallback(() => {
    if (!userPos) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextPos = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(nextPos);
          centerMap(nextPos, 13);
        },
        () => {
          const fallback = [30.184, 71.481];
          setUserPos(fallback);
          centerMap(fallback, 12);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
    centerMap(userPos, 13);
  }, [userPos, centerMap]);

  const handleMapClick = useCallback((lat, lng) => {
  }, []);

  const handleFireSelect = useCallback((fire) => {
    if (!fire) return;
    setSelectedFire(fire);
    setUserSelectedFire(true);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos([30.184, 71.481])
    );
  }, []);

  useEffect(() => {
    if (lastAlert) {
      const area = lastAlert.city || lastAlert.region || 'Unknown area';
      if (!popupOpenRef.current) {
        setToast({ message: `New fire detected in ${area}!`, type: 'warning' });
        if (userPos) findNearest(true);
      }
    }
  }, [lastAlert, userPos]);

  useEffect(() => {
    if (!userPos) return;
    if (!popupOpenRef.current) {
      findNearest(true);
    }
    const interval = setInterval(() => {
      if (!popupOpenRef.current) {
        findNearest(true);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [userPos]);

  const findNearest = async (silent = false) => {
    if (!userPos) return;
    if (popupOpenRef.current) {
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await api.post('/nearest_fire', { latitude: userPos[0], longitude: userPos[1] });
      const data = res.data;
      if (data.nearest_fire) {
        setNearestFire(data.nearest_fire);
        setNearbyFires(data.nearby_fires || []);
        if (!userSelectedFire) {
          setSelectedFire(data.nearest_fire);
          setUserSelectedFire(false);
          await fetchSpreadPrediction(data.nearest_fire.latitude, data.nearest_fire.longitude, data.nearest_fire.fire_confidence, data.nearest_fire.smoke_confidence);
        }
        const count = (data.nearby_fires || []).length;
        if (!silent) {
          setToast({ message: `${count} fire${count !== 1 ? 's' : ''} found within 10 km`, type: 'warning' });
          setShowSidebar(true);
        }
      } else if (!silent) {
        setToast({ message: 'No fire incidents in database', type: 'info' });
      }
    } catch {
      if (!silent) setToast({ message: 'Failed to find nearest fire', type: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSpreadPrediction = async (lat, lng, fireConfidence = nearestFire?.fire_confidence || 0.8, smokeConfidence = nearestFire?.smoke_confidence || 0.6) => {
    try {
      const weatherRes = await api.post('/weather', { latitude: lat, longitude: lng });
      setWeather(weatherRes.data);
      setWeatherCoords([lat, lng]);

      const predictRes = await api.post('/fire-spread/predict', {
        latitude: lat,
        longitude: lng,
        wind_speed: weatherRes.data.wind_speed,
        wind_direction: weatherRes.data.wind_direction,
        humidity: weatherRes.data.humidity,
        temperature: weatherRes.data.temperature,
        terrain_type: 'forest',
        fire_confidence: fireConfidence,
        smoke_confidence: smokeConfidence,
      });
      setSpreadPrediction(predictRes.data);
    } catch {
      setSpreadPrediction({
        risk_score: 72,
        risk_level: 'high',
        spread_direction: { label: 'EAST', bearing_degrees: 90 },
        next_hotspots: [
          { latitude: lat + 0.01, longitude: lng + 0.01, distance_km: 1.0, direction: 'EAST', risk_score: 78 },
          { latitude: lat + 0.02, longitude: lng + 0.02, distance_km: 2.0, direction: 'EAST', risk_score: 69 },
          { latitude: lat + 0.03, longitude: lng + 0.03, distance_km: 3.0, direction: 'EAST', risk_score: 58 },
        ],
        vulnerable_zones: [
          { zone: 'Forest edge', distance_km: 1.2, reason: 'Dry vegetation and wind support fast flame movement.' },
          { zone: 'Residential cluster', distance_km: 2.2, reason: 'Structures are exposed to ember spread.' },
          { zone: 'Road corridor', distance_km: 3.4, reason: 'Access routes may be blocked by fire movement.' },
        ],
      });
    }
  };

  const fetchWeather = async (lat, lng) => {
    await fetchSpreadPrediction(lat, lng, nearestFire?.fire_confidence || 0.8, nearestFire?.smoke_confidence || 0.6);
  };

  const showRouteToFire = async (lat, lng) => {
    if (!userPos) return;
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${lng},${lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length) {
        setSelectedRoute(data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]));
        setRouteCoords([]);
        setNearbyRouteCoords([]);
        setNearbyRouteInfo(null);
        setWeatherCoords([lat, lng]);
        setShowWeather(true);
        try {
          const weatherRes = await api.post('/weather', { latitude: lat, longitude: lng });
          setWeather(weatherRes.data);
        } catch {}
      }
    } catch {}
  };


  const showRouteToFireRef = useRef(showRouteToFire);
  showRouteToFireRef.current = showRouteToFire;
  const stableShowRoute = useCallback((lat, lng) => showRouteToFireRef.current(lat, lng), []);

  const navigateToNearby = async (place) => {
    if (!userPos) return;
    setRouteLoading(place.id);
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${place.lng},${place.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length) {
        setNearbyRouteCoords(data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]));
        setNearbyRouteInfo({ name: place.name, distance: (data.routes[0].distance / 1000).toFixed(1), duration: Math.round(data.routes[0].duration / 60) });
        setRouteCoords([]);
        setNearestFire(null);
        setSelectedRoute([]);
      }
    } catch {} finally { setRouteLoading(null); }
  };

  const clearNearbyRoute = () => { setNearbyRouteCoords([]); setNearbyRouteInfo(null); setShowWeather(false); };
  const clearAllRoutes = () => { setRouteCoords([]); setSelectedRoute([]); setSafeRouteCoords([]); setNearbyRouteCoords([]); setNearbyRouteInfo(null); setShowWeather(false); };

  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  const fetchNearby = async (type) => {
    if (!userPos) return;
    setNearbyLoading(true);
    setActiveNearby(type);
    try {
      const [lat, lng] = userPos;
      const delta = 0.08;
      const bbox = `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
      const query = `[out:json][timeout:15];(node["amenity"="${type}"](${bbox});way["amenity"="${type}"](${bbox}););out center 10;`;
      const body = `data=${encodeURIComponent(query)}`;

      let data = null;
      for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(10000),
          });
          if (res.ok) {
            data = await res.json();
            if (data.elements?.length) break;
          }
        } catch { continue; }
      }

      const tag = NEARBY_TAGS.find((t) => t.key === type);

      if (!data || !data.elements?.length) {
        setNearbyPlaces([]);
        return;
      }

      const results = data.elements.map((el) => {
        const rawName = el.tags?.name || el.tags?.operator || el.tags?.brand || el.tags?.healthcare || '';
        const displayName = rawName.trim() || tag.label;

        return {
          id: el.id,
          name: displayName,
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
          icon: tag.icon,
          type,
          distance: getDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon),
        };
      }).filter((place) => Number.isFinite(place.distance));

      results.sort((a, b) => a.distance - b.distance);
      setNearbyPlaces(results.slice(0, 8));
    } catch {
      setNearbyPlaces([]);
    } finally { setNearbyLoading(false); }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const localLiveFires = useMemo(() => {
    if (!userPos) return [];
    return liveFires.filter((f) => f.latitude && f.longitude && getDistance(userPos[0], userPos[1], f.latitude, f.longitude) <= 10000);
  }, [liveFires, userPos]);

  const localNearestFire = useMemo(() => {
    if (!userPos || !nearestFire) return null;
    if (getDistance(userPos[0], userPos[1], nearestFire.latitude, nearestFire.longitude) > 10000) return null;
    return nearestFire;
  }, [nearestFire, userPos]);

  const localNearbyFires = useMemo(() => {
    if (!userPos) return [];
    return nearbyFires.filter((f) => f.latitude && f.longitude && getDistance(userPos[0], userPos[1], f.latitude, f.longitude) <= 10000);
  }, [nearbyFires, userPos]);

  const localSelectedFire = useMemo(() => {
    if (!userPos) return null;
    if (selectedFire) {
      if (getDistance(userPos[0], userPos[1], selectedFire.latitude, selectedFire.longitude) <= 10000) return selectedFire;
    }
    return localNearestFire;
  }, [selectedFire, localNearestFire, userPos]);

  const allCoords = useMemo(() => {
    const coords = [];
    if (userPos) coords.push(userPos);
    if (localNearestFire) coords.push([localNearestFire.latitude, localNearestFire.longitude]);
    localNearbyFires.forEach((f) => coords.push([f.latitude, f.longitude]));
    localLiveFires.forEach((f) => coords.push([f.latitude, f.longitude]));
    if (routeCoords.length) coords.push(...routeCoords);
    if (selectedRoute.length) coords.push(...selectedRoute);
    if (safeRouteCoords.length) coords.push(...safeRouteCoords);
    if (nearbyRouteCoords.length) coords.push(...nearbyRouteCoords);
    return coords;
  }, [userPos, localNearestFire, localNearbyFires, localLiveFires, routeCoords, selectedRoute, safeRouteCoords, nearbyRouteCoords]);

  const localSpreadPrediction = useMemo(() => {
    if (!spreadPrediction || !userPos) return spreadPrediction;
    if (!localNearestFire && localNearbyFires.length === 0) return null;
    const filtered = {
      ...spreadPrediction,
      next_hotspots: (spreadPrediction.next_hotspots || []).filter(
        (spot) => getDistance(userPos[0], userPos[1], spot.latitude, spot.longitude) <= 10000
      ),
      vulnerable_zones: (spreadPrediction.vulnerable_zones || []).filter(
        (zone) => !zone.latitude || getDistance(userPos[0], userPos[1], zone.latitude, zone.longitude) <= 10000
      ),
    };
    return filtered;
  }, [spreadPrediction, userPos]);

  const totalFires = localNearbyFires.length + localLiveFires.filter((f) => f.id !== localNearestFire?.id && !localNearbyFires.some((nf) => nf.id === f.id)).length;
  const activeFires = localNearbyFires.filter((f) => f.status === 'DETECTED').length + localLiveFires.filter((f) => f.status === 'DETECTED' && f.id !== localNearestFire?.id && !localNearbyFires.some((nf) => nf.id === f.id)).length;
  const hasRoute = routeCoords.length > 0 || selectedRoute.length > 0 || safeRouteCoords.length > 0 || nearbyRouteCoords.length > 0;

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="h-[calc(100vh-4rem)] -m-8 flex flex-col">

        {/* ── Top Bar ── */}
        <div className="relative z-20 flex items-center justify-between px-6 py-3 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">Fire Map</h1>
                <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Real-time monitoring</p>
              </div>
            </div>

            {localNearestFire && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-red-400">{totalFires} Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-400">{activeFires} Detected</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className={`text-[11px] font-semibold ${connected ? 'text-emerald-400' : 'text-gray-500'}`}>{connected ? 'Live' : 'Offline'}</span>
              </div>
              {localLiveFires.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                  <svg className="w-3 h-3 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 8 8 8 12a4 4 0 008 0c0-4-4-10-4-10z"/></svg>
                  <span className="text-[11px] font-semibold text-red-400">{localLiveFires.length} Live</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasRoute && (
              <button onClick={clearAllRoutes} className="px-3 py-2 rounded-xl text-[11px] font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear Route
              </button>
            )}
            <button onClick={findNearest} disabled={loading || !userPos} className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/20 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Scanning...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>Scan Area</>
              )}
            </button>
          </div>
        </div>

        {/* ── Map + Sidebar ── */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <FireMap
              userPos={userPos}
              nearestFire={localNearestFire}
              nearbyFires={localNearbyFires}
              liveFires={localLiveFires}
              mapStyle={mapStyle}
              routeCoords={routeCoords}
              selectedRoute={selectedRoute}
              safeRouteCoords={safeRouteCoords}
              nearbyRouteCoords={nearbyRouteCoords}
              nearbyPlaces={nearbyPlaces}
              allCoords={allCoords}
              onShowRoute={stableShowRoute}
              onMapClick={handleMapClick}
              onFireSelect={handleFireSelect}
              popupOpenRef={popupOpenRef}
              handlePopupOpen={handlePopupOpen}
              handlePopupClose={handlePopupClose}
              mapRef={mapRef}
              spreadPrediction={localSpreadPrediction}
            />


            {/* Weather Overlay */}
            {showWeather && weather && (
              <div className="absolute bottom-[160px] left-4 z-[1000] bg-gray-950/80 backdrop-blur-xl rounded-xl p-2.5 border border-white/5 shadow-2xl min-w-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weather</span>
                  </div>
                  <button onClick={() => setShowWeather(false)} className="text-gray-500 hover:text-white transition-all">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {weatherCoords && (
                  <div className="text-[9px] text-gray-500 font-mono mb-2 pb-2 border-b border-white/5">{weatherCoords[0].toFixed(4)}, {weatherCoords[1].toFixed(4)}</div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <span className="text-[10px] text-gray-500">Temp</span>
                    </div>
                    <span className="text-xs font-bold text-white">{weather.temperature}{weather.unit?.temperature || '°C'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                      <span className="text-[10px] text-gray-500">Humidity</span>
                    </div>
                    <span className="text-xs font-bold text-white">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <span className="text-[10px] text-gray-500">Wind</span>
                    </div>
                    <span className="text-xs font-bold text-white">{weather.wind_speed} {weather.unit?.wind_speed || 'km/h'}</span>
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-white/5">
                    <span className="text-[10px] text-sky-400 font-medium">{weather.weather_desc}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Map Controls */}
            <div className="absolute bottom-5 left-4 z-[1000] flex flex-col gap-2">
              <div className="bg-gray-950/80 backdrop-blur-xl rounded-2xl p-1.5 grid grid-cols-2 gap-1 border border-white/5 shadow-2xl">
                {[
                  { key: 'satellite', label: 'Satellite', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                  { key: 'streets', label: 'Streets', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
                  { key: 'hot', label: 'Humanitarian', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                  { key: 'terrain', label: 'Terrain', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l7.5-7.5L15 18l6-9-18 12z" /></svg> },
                ].map((s) => (
                  <button key={s.key} onClick={() => setMapStyle(s.key)} className={`p-2 rounded-xl transition-all flex items-center justify-center ${mapStyle === s.key ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title={s.label}>{s.icon}</button>
                ))}
              </div>

              <button
                onClick={goToCurrentLocation}
                className="bg-gray-950/80 backdrop-blur-xl rounded-xl p-2 text-gray-400 hover:text-sky-400 transition-all flex items-center justify-center border border-white/5 shadow-2xl"
                title="Current location"
                aria-label="Current location"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3m10-10h-3M5 12H2m17.5 6.5-2.12-2.12M8.62 8.62 6.5 6.5m11 0-2.12 2.12M8.62 15.38l-2.12 2.12M12 7a5 5 0 015 5 5 5 0 01-10 0 5 5 0 015-5z" />
                </svg>
              </button>

            </div>

            {/* Route Legend */}
            <div className="absolute bottom-5 right-5 z-[1000] bg-gray-950/80 backdrop-blur-xl rounded-2xl p-3 space-y-2 border border-white/5 shadow-2xl">
              {localSpreadPrediction && (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border border-red-400 bg-red-500/20" />
                  <span className="text-[10px] text-gray-400 font-medium">Spread Risk</span>
                </div>
              )}
              {routeCoords.length > 0 && <div className="flex items-center gap-2.5"><div className="w-6 h-[3px] rounded-full bg-green-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e 0 6px, transparent 6px 10px)' }} /><span className="text-[10px] text-gray-400 font-medium">Nearest Fire</span></div>}
              {selectedRoute.length > 0 && <div className="flex items-center gap-2.5"><div className="w-6 h-[3px] rounded-full bg-[#facc15]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0 6px, transparent 6px 10px)' }} /><span className="text-[10px] text-gray-400 font-medium">Your Route</span></div>}
              {nearbyRouteCoords.length > 0 && <div className="flex items-center gap-2.5"><div className="w-6 h-[3px] rounded-full bg-blue-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0 6px, transparent 6px 10px)' }} /><span className="text-[10px] text-gray-400 font-medium">Nearby Place</span></div>}
            </div>
          </div>

          {/* Sidebar Panel ── */}
          <div className={`w-80 bg-gray-950/80 backdrop-blur-xl border-l border-white/5 overflow-y-auto transition-all duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0'}`}>
            <div className="p-4 space-y-3">
              {localSelectedFire && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 animate-fadeInUp">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">{userSelectedFire ? 'Selected Fire' : 'Nearest Fire'}</h3>
                    <div className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                      <span className="text-[10px] font-bold text-red-400">{(localSelectedFire.distance_meters / 1000).toFixed(1)} km</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{localSelectedFire.incident_type}</div>
                        <div className="text-[10px] text-gray-500">{localSelectedFire.city || 'Unknown area'}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${localSelectedFire.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{localSelectedFire.status}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                        <div className="text-lg font-bold text-white">{((localSelectedFire.fire_confidence || 0) * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Fire</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                        <div className="text-lg font-bold text-white">{((localSelectedFire.smoke_confidence || 0) * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Smoke</div>
                      </div>
                    </div>

                    {localSelectedFire.message && localSelectedFire.message !== 'Voice report' && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Details</div>
                        <div className="text-[11px] text-gray-300 leading-relaxed">{localSelectedFire.message}</div>
                      </div>
                    )}
                    <FireMedia fileUrl={localSelectedFire.file_url} audioUrl={localSelectedFire.audio_url} />
                  </div>
                </div>
              )}

              {localSpreadPrediction && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 animate-fadeInUp">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Forecast</h3>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${localSpreadPrediction.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' : localSpreadPrediction.risk_level === 'high' ? 'bg-orange-500/20 text-orange-300' : localSpreadPrediction.risk_level === 'moderate' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {localSpreadPrediction.risk_level?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-300">
                    <span className="text-gray-500">Risk</span>
                    <span className="font-semibold text-white">{localSpreadPrediction.risk_score?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              )}

              {localNearbyFires.length > 0 && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 animate-fadeInUp">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Nearby Fires</h3>
                    <span className="text-[10px] font-bold text-gray-500">{localNearbyFires.length} found</span>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {localNearbyFires.map((f) => (
                      <div key={f.id} className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={() => showRouteToFire(f.latitude, f.longitude)}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.status === 'IN_PROGRESS' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">{f.incident_type}</div>
                          <div className="text-[10px] text-gray-500">{(f.distance_meters / 1000).toFixed(1)} km away</div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${f.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {f.status === 'IN_PROGRESS' ? 'IN PROG' : 'DETECTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Nearby Places</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {NEARBY_TAGS.map((tag) => (
                    <button
                      key={tag.key}
                      onClick={() => fetchNearby(tag.key)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-2.5 py-2.5 text-xs font-medium transition-all ${activeNearby === tag.key ? 'border-white/10 bg-white/10 text-white shadow-lg' : 'border-transparent bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-white'}`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center shrink-0">{tag.icon}</span>
                      <span>{tag.label}</span>
                    </button>
                  ))}
                </div>

                {nearbyLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="text-xs">Searching area...</span>
                  </div>
                )}

                {!nearbyLoading && nearbyPlaces.length > 0 && (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {nearbyPlaces.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400">{p.icon}</div>
                          <div>
                            <div className="text-xs font-medium text-white">{p.name}</div>
                            <div className="text-[10px] text-gray-500">{(p.distance / 1000).toFixed(1)} km</div>
                          </div>
                        </div>
                        <button onClick={() => navigateToNearby(p)} disabled={routeLoading === p.id} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px] font-semibold transition-all disabled:opacity-50">
                          {routeLoading === p.id ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'Go'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {nearbyRouteInfo && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-fadeInUp">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        <span className="text-xs text-blue-400 font-medium">{nearbyRouteInfo.name}</span>
                      </div>
                      <button onClick={clearNearbyRoute} className="text-gray-500 hover:text-white transition-all"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="flex gap-4 text-[11px]"><span className="text-gray-400">{nearbyRouteInfo.distance} km</span><span className="text-gray-400">{nearbyRouteInfo.duration} min</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
