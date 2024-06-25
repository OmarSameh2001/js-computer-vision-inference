import React, { useState, useRef } from "react";
import * as ort from "onnxruntime-web";
import { Tensor } from "onnxruntime-web";
import axios from "axios";
import * as Jimp from "jimp";

const ObjectDetection = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(null);
  const [image, setImage] = useState(null);
  const [iTensor, setITensor] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  async function float32ArrayToArray(float32Array) {
    const newArray = [];
    for (let i = 0; i < float32Array.length; i++) {
      newArray[i] = float32Array[i].toFixed(2);
    }

    setPredictions(newArray);
    console.log(predictions);
  }

  async function handleModelChange(event) {
    setLoading(true);

    const model = event.target.files[0];
    console.log(model); // model file content is available in
    setName(model.name);

    // Use FileReader to read the model file
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      const modelData = e.target.result;

      // Call loadModel with the modelData
      await loadModel(modelData);

      setLoading(false);
    };

    reader.readAsArrayBuffer(model); // Start reading the file as ArrayBuffer
  }

  // Load the ONNX model
  const loadModel = async (modelData) => {
    try {
      setLoading(true);

      const session = await ort.InferenceSession.create(modelData, {
        executionProviders: ["webgl"],
        graphOptimizationLevel: "all",
      });

      setModel(session);
      console.log(session);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load model:", error);
      setLoading(false);
    }
  };

  // Run inference on the input image
  const runInference = async (images) => {
    try {
      setLoading(true);
      if (!model) {
        console.error("Model not loaded");
        setLoading(false);
        return;
      }
      //console.log(images);
      const outputs = await model.run({ images: images });
      //setPredictions(outputs["output0"].data);
      console.log(outputs["output0"].data); // outputs["output0"].data;
      console.log("------------------------");
      float32ArrayToArray(outputs["output0"].data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to run inference:", error);
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    setLoading(true);
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;
      console.log(image);
      image.onload = () => {
        setImage(image.src);
        loadImageAndCreateTensor(image);
      };
    };
    reader.readAsDataURL(file);
  };
  const loadImageAndCreateTensor = async (img, width = 640, height = 640) => {
    try {
      setLoading(true);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, height, width);

      const imageData = context.getImageData(0, 0, 640, 640);
      const { data } = imageData;
      const floatData = new Float32Array(3 * height * width);
      for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
        floatData[j] = data[i] / 255; // R
        floatData[j + 1] = data[i + 1] / 255; // G
        floatData[j + 2] = data[i + 2] / 255; // B
      }
      const inputTensor = new Tensor("float32", floatData, [
        1,
        3,
        height,
        width,
      ]);
      //console.log(inputTensor);
      setLoading(false);
      //runInference(inputTensor);
      setITensor(inputTensor);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const postprocessOutput = (output) => {
    // Convert model output to predictions
    return [{ label: "Object", confidence: 0.9, bbox: [0, 0, 100, 100] }];
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>ONNX Computer Vision</h1>
      {model && !loading && <h5>Model "{name}" is loaded successfully </h5>}

      {loading && <p>Loading...</p>}

      {/* File input for model selection */}
      <input
        type="file"
        accept="*"
        ref={fileInputRef}
        onChange={handleModelChange}
        style={{ display: "none" }} // Hide the default file input
      />
      {!model && (
        <button
          onClick={() => fileInputRef.current.click()}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            textAlign: "center",
            margin: "10px",
          }}
        >
          {"Select model"}
        </button>
      )}
      {model && (
        <button
          onClick={() => setModel(null)}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            textAlign: "center",
            margin: "10px",
          }}
        >
          Delete model
        </button>
      )}
      {/* File input for image selection */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }} // Hide the default file input
      />
      <button
        onClick={() => imageInputRef.current.click()}
        style={{
          backgroundColor: "green",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          textAlign: "center",
          margin: "10px",
        }}
      >
        Select image
      </button>
      <img src={image} style={{ maxWidth: "50vw", maxHeight: "50vh" }}></img>
      {image && model && iTensor && (
        <button
          onClick={() => runInference(iTensor)}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            textAlign: "center",
            margin: "10px",
          }}
        >
          {"Run inference"}
        </button>
      )}

<div
  style={{
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap", // This will help to wrap items in case they overflow
    gap: "20px", // Adding some gap between the items
    padding: "10px",
  }}
>
  {predictions &&
    predictions.map((prediction, index) => (
      <div 
        key={index} // Move key here for proper React key assignment
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "10px 20px",
          margin: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#f9f9f9",
        }}
      >
        <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>
          The confidence of class {index + 1} is {prediction}%
        </p>
      </div>
    ))}
</div>

    </div>
  );
};

export default ObjectDetection;
