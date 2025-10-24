"""API routes for model management."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..services.model_service import model_service
from ..utils.logger import logger

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
async def get_models() -> Dict[str, Any]:
    """Get all available models.

    Returns:
        Dictionary containing current model and available models
    """
    try:
        current = model_service.get_current_model()
        available = model_service.get_all_models()

        logger.log('INFO', 'Models list retrieved', {
            'current_model': current['id'],
            'available_count': len(available)
        })

        return {
            "current": current,
            "available": available
        }

    except Exception as e:
        logger.log('ERROR', f'Failed to get models: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/current")
async def get_current_model() -> Dict[str, Any]:
    """Get the currently active model configuration.

    Returns:
        Dictionary containing current model configuration
    """
    try:
        model = model_service.get_current_model()

        logger.log('DEBUG', 'Current model retrieved', {
            'model_id': model['id']
        })

        return model

    except Exception as e:
        logger.log('ERROR', f'Failed to get current model: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/switch/{model_id}")
async def switch_model(model_id: str) -> Dict[str, Any]:
    """Switch to a different model.

    Args:
        model_id: ID of the model to switch to

    Returns:
        Dictionary containing the new model configuration
    """
    try:
        model = model_service.switch_model(model_id)

        logger.log('INFO', f'Model switched to {model_id}', {
            'model_id': model_id,
            'model_path': model.get('model_path')
        })

        return {
            "success": True,
            "model": model,
            "message": f"Switched to model: {model['display_name']}"
        }

    except ValueError as e:
        logger.log('WARNING', f'Invalid model switch attempt: {str(e)}', {
            'model_id': model_id
        })
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        logger.log('ERROR', f'Failed to switch model: {str(e)}', {
            'model_id': model_id
        })
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/params")
async def get_model_params(model_id: str = None) -> Dict[str, Any]:
    """Get parameters for a specific model.

    Args:
        model_id: Optional model ID. If not provided, uses current model

    Returns:
        Dictionary containing model parameters
    """
    try:
        params = model_service.get_model_params(model_id)

        logger.log('DEBUG', 'Model parameters retrieved', {
            'model_id': model_id or 'current'
        })

        return params

    except Exception as e:
        logger.log('ERROR', f'Failed to get model params: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))
