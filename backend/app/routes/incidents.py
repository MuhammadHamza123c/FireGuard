from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.services.supabase_db import (
    get_user_incidents,
    get_incident_by_id,
    update_incident,
    delete_incident,
    recalculate_points,
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class UpdateIncidentRequest(BaseModel):
    status: str


@router.get("")
async def list_incidents(user: dict = Depends(get_current_user)):
    try:
        incidents = await get_user_incidents(user["id"])

        return {
            "success": True,
            "total": len(incidents),
            "incidents": incidents,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{incident_id}")
async def get_incident(
    incident_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        incident = await get_incident_by_id(incident_id)

        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        return {
            "success": True,
            "incident": incident,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{incident_id}")
async def update_status(
    incident_id: str,
    req: UpdateIncidentRequest,
    user: dict = Depends(get_current_user),
):
    try:
        incident = await get_incident_by_id(incident_id)

        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        if incident.get("user_id") != user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own incidents",
            )

        valid_statuses = ["DETECTED", "IN_PROGRESS", "RESOLVED"]
        if req.status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
            )

        updated = await update_incident(incident_id, {"status": req.status})
        profile = await recalculate_points(user["id"])

        return {
            "success": True,
            "incident": updated,
            "profile": profile,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{incident_id}")
async def remove_incident(
    incident_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        incident = await get_incident_by_id(incident_id)

        if not incident:
            return {"success": True, "message": "Incident already removed"}

        if incident.get("user_id") != user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own incidents",
            )

        await delete_incident(incident_id)
        profile = await recalculate_points(user["id"])

        return {
            "success": True,
            "message": "Incident deleted",
            "profile": profile,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
