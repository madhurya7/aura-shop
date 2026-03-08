import headphonesImg from "@/assets/products/headphones.jpg";
import keyboardImg from "@/assets/products/keyboard.jpg";
import mouseImg from "@/assets/products/mouse.jpg";
import laptopStandImg from "@/assets/products/laptop-stand.jpg";
import smartwatchImg from "@/assets/products/smartwatch.jpg";
import usbHubImg from "@/assets/products/usb-hub.jpg";
import speakerImg from "@/assets/products/speaker.jpg";
import ssdImg from "@/assets/products/ssd.jpg";

// Map database image_url paths to local asset imports
const imageMap: Record<string, string> = {
  "/products/headphones.jpg": headphonesImg,
  "/products/keyboard.jpg": keyboardImg,
  "/products/mouse.jpg": mouseImg,
  "/products/laptop-stand.jpg": laptopStandImg,
  "/products/smartwatch.jpg": smartwatchImg,
  "/products/usb-hub.jpg": usbHubImg,
  "/products/speaker.jpg": speakerImg,
  "/products/ssd.jpg": ssdImg,
};

export function getProductImage(imageUrl: string): string {
  return imageMap[imageUrl] || imageUrl;
}
