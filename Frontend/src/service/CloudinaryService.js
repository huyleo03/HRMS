const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

export const uploadFileToCloudinary = async (file) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error('❌ Missing Cloudinary config:', { 
      CLOUD_NAME, 
      UPLOAD_PRESET,
      allEnvVars: process.env 
    });
    throw new Error("Cấu hình Cloudinary không đầy đủ. Vui lòng kiểm tra file .env");
  }

  console.log('📤 Uploading to Cloudinary:', { CLOUD_NAME, UPLOAD_PRESET });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudinary upload error:', errorData);
      throw new Error(errorData.error?.message || "Upload file không thành công.");
    }

    const data = await response.json();
    console.log('✅ Upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error("❌ Lỗi khi upload file lên Cloudinary:", error);
    throw error;
  }
};