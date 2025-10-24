"""Service for interacting with vLLM server."""
import httpx
import base64
import os
from typing import Dict, Any, Optional
from io import BytesIO
from PIL import Image

from .model_service import model_service
from ..utils.logger import logger


class VLLMService:
    """Service for communicating with vLLM server for OCR processing."""

    def __init__(self, server_url: Optional[str] = None):
        """Initialize vLLM service.

        Args:
            server_url: URL of the vLLM server. If None, uses env variable
        """
        self.server_url = server_url or os.getenv("VLLM_SERVER_URL", "http://localhost:8001")
        self.timeout = 300.0  # 5 minutes timeout for OCR processing

    async def health_check(self) -> bool:
        """Check if vLLM server is healthy.

        Returns:
            True if server is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.server_url}/health")
                return response.status_code == 200
        except Exception as e:
            logger.log('WARNING', f'vLLM health check failed: {str(e)}')
            return False

    async def process_image(
        self,
        image_base64: str,
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """Process an image through vLLM for OCR.

        Args:
            image_base64: Base64 encoded image
            config: Optional configuration parameters

        Returns:
            Extracted text from the image
        """
        # Get current model configuration
        model_config = model_service.get_current_model()
        model_params = model_config.get('parameters', {})

        # Merge with provided config
        if config:
            model_params.update(config)

        # Prepare payload for vLLM
        payload = {
            "model": model_config['model_path'],
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Maintain the original layout and formatting as much as possible."
                        }
                    ]
                }
            ],
            "temperature": model_params.get('temperature', 0.2),
            "top_p": model_params.get('top_p', 0.9),
            "max_tokens": model_params.get('max_tokens', 6500)
        }

        try:
            logger.log('INFO', 'Sending image to vLLM for processing', {
                'model': model_config['model_path'],
                'image_size': len(image_base64)
            })

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.server_url}/v1/chat/completions",
                    json=payload
                )

                if response.status_code != 200:
                    error_msg = f"vLLM returned status {response.status_code}: {response.text}"
                    logger.log('ERROR', error_msg)
                    raise Exception(error_msg)

                result = response.json()

                # Extract text from response
                if 'choices' in result and len(result['choices']) > 0:
                    text = result['choices'][0]['message']['content']

                    logger.log('INFO', 'OCR processing completed successfully', {
                        'text_length': len(text),
                        'model': model_config['model_path']
                    })

                    return text
                else:
                    raise Exception("No text content in vLLM response")

        except httpx.TimeoutException:
            error_msg = "vLLM request timed out"
            logger.log('ERROR', error_msg, {
                'timeout': self.timeout
            })
            raise Exception(error_msg)

        except Exception as e:
            logger.log('ERROR', f'vLLM processing failed: {str(e)}')
            raise


    def image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string.

        Args:
            image: PIL Image object

        Returns:
            Base64 encoded image string
        """
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()
        return base64.b64encode(img_bytes).decode('utf-8')


# Global vLLM service instance
vllm_service = VLLMService()
