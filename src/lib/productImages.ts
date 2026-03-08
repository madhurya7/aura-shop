import headphonesImg from "@/assets/products/headphones.jpg";
import keyboardImg from "@/assets/products/keyboard.jpg";
import mouseImg from "@/assets/products/mouse.jpg";
import laptopStandImg from "@/assets/products/laptop-stand.jpg";
import smartwatchImg from "@/assets/products/smartwatch.jpg";
import usbHubImg from "@/assets/products/usb-hub.jpg";
import speakerImg from "@/assets/products/speaker.jpg";
import ssdImg from "@/assets/products/ssd.jpg";
import ceramicVaseImg from "@/assets/products/ceramic-vase.jpg";
import macrameDecorImg from "@/assets/products/macrame-decor.jpg";
import potteryBowlImg from "@/assets/products/pottery-bowl.jpg";
import silverNecklaceImg from "@/assets/products/silver-necklace.jpg";
import embroideredToteImg from "@/assets/products/embroidered-tote.jpg";
import beadBraceletImg from "@/assets/products/bead-bracelet.jpg";
import handloomScarfImg from "@/assets/products/handloom-scarf.jpg";
import handloomRunnerImg from "@/assets/products/handloom-runner.jpg";

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
  "/products/ceramic-vase.jpg": ceramicVaseImg,
  "/products/macrame-decor.jpg": macrameDecorImg,
  "/products/pottery-bowl.jpg": potteryBowlImg,
  "/products/silver-necklace.jpg": silverNecklaceImg,
  "/products/embroidered-tote.jpg": embroideredToteImg,
  "/products/bead-bracelet.jpg": beadBraceletImg,
  "/products/handloom-scarf.jpg": handloomScarfImg,
  "/products/handloom-runner.jpg": handloomRunnerImg,
};

export function getProductImage(imageUrl: string): string {
  return imageMap[imageUrl] || imageUrl;
}
