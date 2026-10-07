import MainNav from "@/Components/MainNav";
import Footer from "@/Components/Footer";

export default function AppLayout({ children }) {
    return (
        <div className="page-wrapper">
            <div className="bg-grid"></div>
            <MainNav />
            <main>{children}</main>
            <Footer />
        </div>
    );
}
