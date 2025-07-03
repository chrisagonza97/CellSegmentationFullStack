import React, { useState } from "react";
import axios from "axios";

const sampleImages = ["0.png", "1.png", "2.png"];

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [groundTruthMask, setGroundTruthMask] = useState(null);
  const [segResults, setSegResults] = useState(null); // Store both unet and transunet results

  const handleImageClick = async (filename) => {
    const imagePath = `/sample_imgs/cell_imgs/${filename}`;
    const visMaskPath = `/sample_imgs/seg_imgs_vis/${filename}`;
    const rawMaskPath = `/sample_imgs/seg_imgs/${filename}`;

    setOriginalImage(imagePath);
    setGroundTruthMask(visMaskPath);

    try {
      const imageBlob = await fetch(imagePath).then((res) => res.blob());
      const maskBlob = await fetch(rawMaskPath).then((res) => res.blob());

      const imageFile = new File([imageBlob], filename, { type: imageBlob.type });
      const maskFile = new File([maskBlob], filename, { type: maskBlob.type });

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("mask", maskFile);

      const res = await axios.post("http://localhost:8000/api/segment/", formData);
      setSegResults(res.data); // Expecting { unet: {image, metrics}, transunet: {image, metrics} }

    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const renderSegmentation = (title, data) => (
    <div>
      <h4>{title}</h4>
      <img src={`data:image/png;base64,${data.image}`} alt={title} style={{ width: 300 }} />
      <div style={{ marginTop: "1rem" }}>
        <h5>AUROC: {data.metrics.auroc !== null ? data.metrics.auroc.toFixed(3) : "N/A"}</h5>
        <pre style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data.metrics.classification_report, null, 2)}
        </pre>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>React + Django: Image Segmentation</h1>
      <h3>Select a sample image to segment:</h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {sampleImages.map((filename) => (
          <button key={filename} onClick={() => handleImageClick(filename)}>
            {filename}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {originalImage && (
          <div>
            <h4>Original</h4>
            <img src={originalImage} alt="Original" style={{ width: 300 }} />
          </div>
        )}
        {groundTruthMask && (
          <div>
            <h4>Ground Truth</h4>
            <img src={groundTruthMask} alt="Ground Truth" style={{ width: 300 }} />
          </div>
        )}
        {segResults?.unet && renderSegmentation("U-Net Predicted", segResults.unet)}
        {segResults?.transunet && renderSegmentation("TransUNet Predicted", segResults.transunet)}
      </div>
      <p style={{ marginTop: "2rem" }}>
        Comparing U-Net and TransUNet segmentations on sample images.
      </p>
    </div>
  );
}

export default App;
