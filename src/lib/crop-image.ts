export interface PixelCropArea {
  x: number
  y: number
  width: number
  height: number
}

interface CropImageOptions {
  /**
   * Output size (square). If set, the cropped result will be resized to size x size.
   * If omitted, the output keeps the cropped pixel dimensions.
   */
  outputSize?: number
  mimeType?: "image/jpeg" | "image/png"
  quality?: number
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = src
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/png",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image"))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

export async function cropImageToBlob(
  imageSrc: string,
  crop: PixelCropArea,
  options: CropImageOptions = {}
): Promise<Blob> {
  const image = await createImage(imageSrc)

  const { outputSize, mimeType = "image/jpeg", quality = 0.9 } = options

  const canvas = document.createElement("canvas")
  canvas.width = outputSize ?? Math.max(1, Math.round(crop.width))
  canvas.height = outputSize ?? Math.max(1, Math.round(crop.height))

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not supported")

  // Crop source is in natural image pixel coordinates.
  // Draw it into the output canvas (optionally resized).
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvasToBlob(canvas, mimeType, mimeType === "image/jpeg" ? quality : undefined)
}
