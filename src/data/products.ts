import headphonesImg from "@/assets/products/headphones.jpg";
import keyboardImg from "@/assets/products/keyboard.jpg";
import mouseImg from "@/assets/products/mouse.jpg";
import laptopStandImg from "@/assets/products/laptop-stand.jpg";
import smartwatchImg from "@/assets/products/smartwatch.jpg";
import usbHubImg from "@/assets/products/usb-hub.jpg";
import speakerImg from "@/assets/products/speaker.jpg";
import ssdImg from "@/assets/products/ssd.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    shortDescription: "Premium noise-cancelling over-ear headphones",
    description: "Experience immersive audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for music lovers and professionals alike.",
    price: 249.99,
    image: headphonesImg,
    category: "Audio",
    stock: 24,
  },
  {
    id: "2",
    name: "Mechanical Keyboard",
    shortDescription: "RGB backlit mechanical keyboard with hot-swap switches",
    description: "Take your typing experience to the next level with our mechanical keyboard. Features hot-swappable switches, per-key RGB lighting, aircraft-grade aluminum frame, and programmable macro keys. Compatible with Windows and macOS.",
    price: 179.99,
    image: keyboardImg,
    category: "Peripherals",
    stock: 35,
  },
  {
    id: "3",
    name: "Gaming Mouse",
    shortDescription: "Precision ergonomic gaming mouse with 16K DPI",
    description: "Dominate your games with our ultra-precise gaming mouse. 16,000 DPI optical sensor, 8 programmable buttons, adjustable weight system, and customizable RGB lighting. Designed for marathon gaming sessions.",
    price: 79.99,
    image: mouseImg,
    category: "Peripherals",
    stock: 52,
  },
  {
    id: "4",
    name: "Laptop Stand",
    shortDescription: "Adjustable aluminum laptop stand for ergonomic comfort",
    description: "Elevate your workspace with our premium aluminum laptop stand. Adjustable height and angle, ventilated design for cooling, and a sleek minimalist aesthetic. Supports laptops up to 17 inches.",
    price: 69.99,
    image: laptopStandImg,
    category: "Accessories",
    stock: 40,
  },
  {
    id: "5",
    name: "Smart Watch",
    shortDescription: "Fitness tracking smartwatch with AMOLED display",
    description: "Stay connected and track your health with our feature-packed smartwatch. Vibrant AMOLED display, heart rate and SpO2 monitoring, GPS tracking, 7-day battery life, and 100+ workout modes. Water resistant to 50m.",
    price: 329.99,
    image: smartwatchImg,
    category: "Wearables",
    stock: 18,
  },
  {
    id: "6",
    name: "USB-C Hub",
    shortDescription: "7-in-1 USB-C hub with 4K HDMI and fast charging",
    description: "Expand your laptop's connectivity with our versatile USB-C hub. Includes 4K HDMI output, 3x USB 3.0 ports, SD/microSD card readers, and 100W Power Delivery passthrough charging. Compact and portable.",
    price: 54.99,
    image: usbHubImg,
    category: "Accessories",
    stock: 67,
  },
  {
    id: "7",
    name: "Bluetooth Speaker",
    shortDescription: "Portable 360° speaker with deep bass",
    description: "Fill any room with rich, immersive sound. Our Bluetooth speaker features 360° audio projection, deep bass enhancement, 12-hour battery, IPX7 waterproofing, and seamless multi-speaker pairing.",
    price: 119.99,
    image: speakerImg,
    category: "Audio",
    stock: 31,
  },
  {
    id: "8",
    name: "Portable SSD",
    shortDescription: "1TB external SSD with blazing-fast transfer speeds",
    description: "Store and transfer files at lightning speed. 1TB capacity, up to 1050MB/s read speeds, USB 3.2 Gen 2 interface, shock-resistant aluminum enclosure, and hardware encryption for data security.",
    price: 129.99,
    image: ssdImg,
    category: "Storage",
    stock: 45,
  },
];

export const categories = [...new Set(products.map((p) => p.category))];
