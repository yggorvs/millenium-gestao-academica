import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Millenium | Gestão acadêmica',description:'Alunos, matrículas e acompanhamento pedagógico da Millenium Tecnologia.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
