import { useEffect, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { IMAGE_UPLOAD_ACCEPT, prepareUploadFiles } from '../../utils/imageUpload.js';

export function ImageUpload({ onImagesChange, maxImages = 10 }) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, []);

  const prepareFiles = async (files, inputElement = null) => {
    if (files.length === 0) {
      return;
    }

    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      if (inputElement) {
        inputElement.value = '';
      }
      return;
    }

    setMessage('');
    setProcessing(true);
    try {
      const prepared = await prepareUploadFiles(files, {
        maxSizeMB: 2,
        maxWidth: 1600,
        maxHeight: 1600,
        allowPdf: false,
      });

      const newImages = [...images, ...prepared.files];
      setImages(newImages);

      const newPreviews = prepared.files.map(file => URL.createObjectURL(file));
      previewUrlsRef.current.push(...newPreviews);
      setPreviews(prev => [...prev, ...newPreviews]);
      setMessage(prepared.messages.length > 0 ? 'Photos converted to JPG for upload.' : `${prepared.files.length} photo(s) ready.`);

      if (onImagesChange) {
        onImagesChange(newImages);
      }
      if (inputElement) {
        inputElement.value = '';
      }
    } catch (error) {
      setMessage(error?.message || 'Unable to prepare selected images.');
      if (inputElement) {
        inputElement.value = '';
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async (event) => {
    await prepareFiles(Array.from(event.target.files || []), event.target);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    await prepareFiles(Array.from(event.dataTransfer.files || []));
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    previewUrlsRef.current = previewUrlsRef.current.filter((preview) => preview !== previews[index]);
    
    setImages(newImages);
    setPreviews(newPreviews);

    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  return (
    <div className="image-upload">
      <div className="upload-header">
        <label>Property Images</label>
        <span className="upload-count">
          {images.length} / {maxImages} images
        </span>
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          multiple
          onChange={handleFileSelect}
          disabled={processing}
          style={{ display: 'none' }}
        />

        {previews.length === 0 ? (
          <div 
            className="upload-placeholder"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={48} />
            <p>{processing ? 'Converting photos...' : 'Click to upload images'}</p>
            <span>or drag and drop</span>
            <button
              type="button"
              className="photo-converter-button"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={processing}
            >
              {processing ? 'Converting...' : 'Convert & add photos'}
            </button>
          </div>
        ) : (
          <div className="image-grid">
            {previews.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => handleRemove(index)}
                >
                  <X size={16} />
                </button>
                {index === 0 && (
                  <div className="featured-badge">Featured</div>
                )}
              </div>
            ))}

            {images.length < maxImages && (
              <div 
                className={`add-more ${processing ? 'disabled' : ''}`}
                onClick={() => {
                  if (!processing) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <ImageIcon size={32} />
                <span>{processing ? 'Converting...' : 'Add More'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <p className="upload-hint">
          First image will be used as the featured image
        </p>
      )}
      {message && <p className="re-upload-note">{message}</p>}
    </div>
  );
}
