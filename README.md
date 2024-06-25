# Host link:
https://js-computer-vision-inference.vercel.app/
# Compatibilty:
With few changes this code can run on node.js server or react native mobile application.

# 1- Convert model to onnx:
https://www.youtube.com/watch?v=lRBsmnBE9ZA
# 2- Limitations:
## 1- Model size:
Uploading models with big size 100mb+ may cause issues due to host server limitations running the website locally is reccomended.
## 2- Classification only:
Onnx runtime doesn't support Object Detection (Int64) models yet
