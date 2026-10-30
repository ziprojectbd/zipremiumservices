import { useEffect } from "react";
import { useParams } from "react-router-dom";
import MainShop from "../../components/public/MainShop";
import { useShopContext } from "../../store/ShopContext";

export default function CatchAllPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { setView } = useShopContext();

    useEffect(() => {
        setView("home");
    }, [setView]);

    return <MainShop categorySlug={slug} />;
}
