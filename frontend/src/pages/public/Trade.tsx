import { useEffect } from "react";
import MainShop from "../../components/public/MainShop";
import { useShopContext } from "../../store/ShopContext";

export default function Trade() {
    const { setView } = useShopContext();

    useEffect(() => {
        setView("home");
    }, [setView]);

    return <MainShop categorySlug="trade" />;
}
