"""API routes for document processing."""
import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image
import pypdfium2 as pdfium
import json

from ..services.vllm_service import vllm_service
from ..services.model_service import model_service
from ..utils.logger import logger

router = APIRouter(prefix="/api", tags=["process"])


@router.post("/process")
async def process_document(
    file: UploadFile = File(...),
    config: Optional[str] = Form(None)
):
    """Process a document (PDF or image) for OCR.

    Args:
        file: Uploaded file (PDF or image)
        config: Optional JSON string with processing configuration

    Returns:
        Dictionary containing extracted text and metadata
    """
    logger.log('INFO', 'Processing document', {
        'filename': file.filename,
        'content_type': file.content_type,
        'size': file.size if hasattr(file, 'size') else 'unknown'
    })

    # Parse config if provided
    processing_config = {}
    if config:
        try:
            processing_config = json.loads(config)
        except json.JSONDecodeError:
            logger.log('WARNING', 'Invalid JSON config provided')

    temp_path = None

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        logger.log('DEBUG', 'Temporary file created', {
            'path': temp_path
        })

        # Determine file type and process accordingly
        content_type = file.content_type or ''
        results = []

        if 'pdf' in content_type.lower() or file.filename.endswith('.pdf'):
            # Process PDF
            logger.log('INFO', 'Processing PDF file')
            images = await pdf_to_images(temp_path)
            logger.log('INFO', f'PDF converted to {len(images)} images')

            for i, image in enumerate(images):
                logger.log('DEBUG', f'Processing page {i + 1}/{len(images)}')
                base64_image = vllm_service.image_to_base64(image)
                text = await vllm_service.process_image(base64_image, processing_config)
                results.append(text)

        else:
            # Process image
            logger.log('INFO', 'Processing image file')
            image = Image.open(temp_path)

            # Resize if too large
            max_dimension = model_service.get_model_params().get('max_dimension', 1300)
            if max(image.size) > max_dimension:
                logger.log('INFO', f'Resizing image from {image.size}')
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            base64_image = vllm_service.image_to_base64(image)
            text = await vllm_service.process_image(base64_image, processing_config)
            results.append(text)

        # Combine results
        combined_text = "\n\n--- Page Break ---\n\n".join(results)

        logger.log('INFO', 'Document processing completed', {
            'filename': file.filename,
            'pages': len(results),
            'text_length': len(combined_text)
        })

        return {
            "success": True,
            "text": combined_text,
            "metadata": {
                "filename": file.filename,
                "pages": len(results),
                "processing_time": 0,  # TODO: Add timing
                "model_used": model_service.get_current_model()['display_name']
            }
        }

    except Exception as e:
        error_msg = f"Processing failed: {str(e)}"
        logger.log('ERROR', error_msg, {
            'filename': file.filename,
            'error': str(e)
        })
        raise HTTPException(status_code=500, detail=error_msg)

    finally:
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.log('DEBUG', 'Temporary file cleaned up', {
                    'path': temp_path
                })
            except Exception as e:
                logger.log('WARNING', f'Failed to cleanup temp file: {str(e)}')


async def pdf_to_images(pdf_path: str, dpi: int = 300) -> list:
    """Convert PDF pages to images.

    Args:
        pdf_path: Path to the PDF file
        dpi: DPI for rendering (default: 300)

    Returns:
        List of PIL Image objects
    """
    images = []

    try:
        pdf = pdfium.PdfDocument(pdf_path)

        for page_num in range(len(pdf)):
            page = pdf[page_num]

            # Render page to bitmap
            bitmap = page.render(
                scale=dpi / 72,  # Convert DPI to scale
                rotation=0
            )

            # Convert to PIL Image
            pil_image = bitmap.to_pil()
            images.append(pil_image)

            logger.log('DEBUG', f'Rendered page {page_num + 1}/{len(pdf)}', {
                'size': pil_image.size
            })

        pdf.close()

    except Exception as e:
        logger.log('ERROR', f'PDF conversion failed: {str(e)}')
        raise

    return images


@router.get("/health/vllm")
async def check_vllm_health():
    """Check if vLLM server is healthy.

    Returns:
        Health status of vLLM server
    """
    is_healthy = await vllm_service.health_check()

    return {
        "healthy": is_healthy,
        "server_url": vllm_service.server_url
    }
