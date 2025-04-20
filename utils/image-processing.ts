/**
 * Resizes an image to the specified dimensions
 */
export function resizeImage(imageData: string, maxWidth = 1280, maxHeight = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Add this to handle CORS issues

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width))
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height))
            height = maxHeight
          }
        }

        // Create canvas and resize
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Draw image with better quality
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to data URL
        const resizedImageData = canvas.toDataURL("image/jpeg", 0.9)
        resolve(resizedImageData)
      } catch (drawError) {
        reject(new Error(`Error processing image: ${drawError.message}`))
      }
    }

    img.onerror = (error) => {
      reject(new Error("Failed to load image"))
    }

    // Handle data URLs or blob URLs
    img.src = imageData
  })
}

/**
 * Enhances an image for better OCR results
 */
export function enhanceImageForOCR(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Add this to handle CORS issues

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Draw original image
        ctx.drawImage(img, 0, 0)

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Simple contrast enhancement and grayscale conversion
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3

          // Increase contrast
          const contrast = 1.5 // Contrast factor
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
          const newValue = factor * (avg - 128) + 128

          // Apply thresholding for text
          const finalValue = newValue > 150 ? 255 : 0

          // Set RGB channels to the same value (black and white)
          data[i] = finalValue // R
          data[i + 1] = finalValue // G
          data[i + 2] = finalValue // B
          // Alpha channel remains unchanged
        }

        // Put the modified data back
        ctx.putImageData(imageData, 0, 0)

        // Convert to data URL
        const enhancedImageData = canvas.toDataURL("image/jpeg", 0.9)
        resolve(enhancedImageData)
      } catch (processError) {
        reject(new Error(`Error enhancing image: ${processError.message}`))
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = imageData
  })
}
