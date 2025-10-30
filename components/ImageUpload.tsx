
import React, { useState, useCallback } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  previewUrl: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelect(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
       if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageSelect(file, reader.result as string);
            };
            reader.readAsDataURL(file);
       }
    }
  }, [onImageSelect]);

  const baseClasses = "relative flex flex-col items-center justify-center w-full min-h-[16rem] md:min-h-[24rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out";
  const draggingClasses = "border-blue-500 bg-blue-900/50";
  const normalClasses = "border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700";
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        className={`${baseClasses} ${isDragging ? draggingClasses : normalClasses}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">JPG or PNG</p>
          </div>
        )}
        <input id="dropzone-file" type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUpload;
