"""Model configuration and management service."""
import yaml
import os
from typing import Dict, Any, Optional
from pathlib import Path


class ModelService:
    """Service for managing model configurations."""

    def __init__(self, config_path: str = "./config/models.yaml"):
        """Initialize the model service.

        Args:
            config_path: Path to the models configuration YAML file
        """
        self.config_path = config_path
        self.config = self.load_config()
        self.current_model = self.config['models']['default']

    def load_config(self) -> Dict[str, Any]:
        """Load model configuration from YAML file.

        Returns:
            Dictionary containing model configurations
        """
        config_file = Path(self.config_path)
        if not config_file.exists():
            raise FileNotFoundError(f"Model config file not found: {self.config_path}")

        with open(config_file, 'r') as f:
            return yaml.safe_load(f)

    def get_current_model(self) -> Dict[str, Any]:
        """Get the current active model configuration.

        Returns:
            Dictionary containing the current model's configuration
        """
        models = self.config['models']['configurations']
        if self.current_model not in models:
            raise ValueError(f"Model {self.current_model} not found in configuration")

        return {
            'id': self.current_model,
            **models[self.current_model]
        }

    def get_all_models(self) -> list[Dict[str, Any]]:
        """Get all available model configurations.

        Returns:
            List of all model configurations
        """
        models = self.config['models']['configurations']
        return [
            {
                'id': model_id,
                **config
            }
            for model_id, config in models.items()
        ]

    def get_model_params(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Get parameters for a specific model.

        Args:
            model_id: ID of the model. If None, uses current model

        Returns:
            Dictionary containing model parameters
        """
        if model_id is None:
            model_id = self.current_model

        models = self.config['models']['configurations']
        if model_id not in models:
            raise ValueError(f"Model {model_id} not found")

        return models[model_id].get('parameters', {})

    def switch_model(self, model_id: str) -> Dict[str, Any]:
        """Switch to a different model.

        Args:
            model_id: ID of the model to switch to

        Returns:
            Dictionary containing the new model's configuration
        """
        models = self.config['models']['configurations']
        if model_id not in models:
            raise ValueError(f"Model {model_id} not found in available models")

        self.current_model = model_id
        return self.get_current_model()

    def get_model_path(self, model_id: Optional[str] = None) -> str:
        """Get the HuggingFace model path for a model.

        Args:
            model_id: ID of the model. If None, uses current model

        Returns:
            String containing the HuggingFace model path
        """
        if model_id is None:
            model_id = self.current_model

        models = self.config['models']['configurations']
        if model_id not in models:
            raise ValueError(f"Model {model_id} not found")

        return models[model_id]['model_path']


# Global model service instance
model_service = ModelService()
