import React, { useState } from "react";

const sampleImages = ["0.png", "1.png", "2.png"];

// Component for image selection buttons
const ImageSelector = ({ images, onImageSelect, selectedImage }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4 text-gray-700">Select a sample image to segment:</h2>
    <div className="flex gap-3 flex-wrap">
      {images.map((filename) => (
        <button
          key={filename}
          onClick={() => onImageSelect(filename)}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 
            ${selectedImage === filename 
              ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
        >
          {filename}
        </button>
      ))}
    </div>
  </div>
);

// Component for displaying a single image with title
const ImageDisplay = ({ title, src, alt }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    <div className="overflow-hidden rounded-lg">
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-64 object-contain bg-gray-50"
      />
    </div>
  </div>
);

// Component for segmentation results with metrics
const SegmentationResult = ({ title, data, modelType }) => {
  const getColorClasses = (type) => {
    switch(type) {
      case 'unet':
        return {
          border: 'border-blue-500',
          title: 'text-blue-700',
          bg: 'bg-blue-50',
          scoreText: 'text-blue-700',
          scoreValue: 'text-blue-600'
        };
      case 'transunet':
        return {
          border: 'border-purple-500',
          title: 'text-purple-700',
          bg: 'bg-purple-50',
          scoreText: 'text-purple-700',
          scoreValue: 'text-purple-600'
        };
      default:
        return {
          border: 'border-gray-500',
          title: 'text-gray-700',
          bg: 'bg-gray-50',
          scoreText: 'text-gray-700',
          scoreValue: 'text-gray-600'
        };
    }
  };
  
  const colors = getColorClasses(modelType);
  
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 ${colors.border}`}>
      <h3 className={`text-lg font-semibold mb-3 ${colors.title}`}>{title}</h3>
      <div className="overflow-hidden rounded-lg mb-4">
        <img 
          src={`data:image/png;base64,${data.image}`} 
          alt={title} 
          className="w-full h-64 object-contain bg-gray-50"
        />
      </div>
      
      <div className="mt-4 space-y-3">
        <div className={`${colors.bg} rounded-lg p-3`}>
          <h4 className={`text-sm font-semibold ${colors.scoreText} mb-1`}>AUROC Score</h4>
          <p className={`text-2xl font-bold ${colors.scoreValue}`}>
            {data.metrics.auroc !== null ? data.metrics.auroc.toFixed(3) : "N/A"}
          </p>
        </div>
        
        <details className="cursor-pointer">
          <summary className="text-sm font-medium text-gray-600 hover:text-gray-800">
            View Classification Report
          </summary>
          <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(data.metrics.classification_report, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Main App component
function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [groundTruthMask, setGroundTruthMask] = useState(null);
  const [segResults, setSegResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageClick = async (filename) => {
    setSelectedImage(filename);
    setError(null);
    setLoading(true);
    
    const imagePath = `/sample_imgs/cell_imgs/${filename}`;
    const visMaskPath = `/sample_imgs/seg_imgs_vis/${filename}`;
    const rawMaskPath = `/sample_imgs/seg_imgs/${filename}`;

    setOriginalImage(imagePath);
    setGroundTruthMask(visMaskPath);
    setSegResults(null);

    try {
      const imageBlob = await fetch(imagePath).then((res) => res.blob());
      const maskBlob = await fetch(rawMaskPath).then((res) => res.blob());

      const imageFile = new File([imageBlob], filename, { type: imageBlob.type });
      const maskFile = new File([maskBlob], filename, { type: maskBlob.type });

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("mask", maskFile);

      const res = await fetch("http://localhost:8000/api/segment/", {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      setSegResults(data);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Medical Image Segmentation
          </h1>
          <p className="text-lg text-gray-600">
            Compare U-Net and TransUNet performance on cell segmentation
          </p>
        </header>

        {/* Image Selector */}
        <ImageSelector 
          images={sampleImages} 
          onImageSelect={handleImageClick}
          selectedImage={selectedImage}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Results Grid */}
        {(originalImage || loading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {originalImage && (
              <ImageDisplay 
                title="Original Image" 
                src={originalImage} 
                alt="Original"
              />
            )}
            
            {groundTruthMask && (
              <ImageDisplay 
                title="Ground Truth" 
                src={groundTruthMask} 
                alt="Ground Truth"
              />
            )}
            
            {loading && !segResults && (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">U-Net Processing...</h3>
                  <LoadingSpinner />
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-purple-700">TransUNet Processing...</h3>
                  <LoadingSpinner />
                </div>
              </>
            )}
            
            {segResults?.unet && (
              <SegmentationResult 
                title="U-Net Predicted" 
                data={segResults.unet}
                modelType="unet"
              />
            )}
            
            {segResults?.transunet && (
              <SegmentationResult 
                title="TransUNet Predicted" 
                data={segResults.transunet}
                modelType="transunet"
              />
            )}
          </div>
        )}

        {/* Instructions */}
        {!selectedImage && (
          <div className="mt-12 text-center p-8 bg-blue-50 rounded-xl">
            <p className="text-lg text-blue-800">
              Select an image above to begin the segmentation analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;