import React, { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

function Dropzone({ required, name }) {
  const hiddenInputRef = useRef(null);
  const [allFiles, setAllFiles] = useState([]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: (incomingFiles) => {
      setAllFiles((prevFiles) => [...prevFiles, ...incomingFiles]);

      if (hiddenInputRef.current) {
        const dataTransfer = new DataTransfer();
        const updatedFiles = [...allFiles, ...incomingFiles];
        updatedFiles.forEach((v) => {
          dataTransfer.items.add(v);
        });
        hiddenInputRef.current.files = dataTransfer.files;
      }
    },
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition 
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400"}`}
      >
        {/* Hidden input for form validation */}
        <input
          type="file"
          name={name}
          required={required}
          style={{ opacity: 0 }}
          ref={hiddenInputRef}
        />
        <input {...getInputProps()} />

        {/* Icon */}
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4a2 2 0 012-2h6a2 2 0 012 2v12m-4 0v4m-4-4h8"
          />
        </svg>

        {/* Message */}
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Drop your files here ...</p>
        ) : (
          <p className="text-gray-600">
            Drag & drop files here, or{" "}
            <span
              className="text-blue-600 font-semibold underline cursor-pointer"
              onClick={open}
            >
              browse
            </span>
          </p>
        )}
      </div>

      {/* File list */}
      {allFiles.length > 0 && (
        <aside className="mt-4 bg-white shadow rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Files</h4>
          <ul className="space-y-2">
            {allFiles.map((file) => (
              <li
                key={file.path}
                className="flex justify-between items-center text-sm text-gray-600"
              >
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
      
    </div>
  );
}

export { Dropzone };
