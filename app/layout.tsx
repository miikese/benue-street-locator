import type {Metadata} from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
export const metadata:Metadata={title:"Benue Street Locator · Find your way",description:"Find streets, discover public places, and help improve the map of Benue, beginning in Otukpo.",manifest:"/manifest.webmanifest",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
