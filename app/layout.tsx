import "./globals.css";
import { AppShell } from "@/components/AppShell";
export const metadata={title:"Sarthi",description:"Your direction, every day",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppShell>{children}</AppShell></body></html>}
