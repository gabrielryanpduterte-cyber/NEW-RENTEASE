import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export function ImageUpload({ onImagesChange, maxImages = 10 }) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
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

      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {previews.length === 0 ? (
          <div 
            className="upload-placeholder"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={48} />
            <p>Click to upload images</p>
            <span>or drag and drop</span>
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
                className="add-more"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={32} />
                <span>Add More</span>
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
    </div>
  );
}
