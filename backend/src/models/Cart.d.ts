import mongoose from 'mongoose';
export interface ICartItem {
    productId: string;
    name: string;
    price: number;
    priceBDT?: number;
    priceUSDT?: number;
    quantity: number;
    dbId?: string;
    link?: string;
    smmProvider?: string;
    smmServiceId?: string;
    category?: string;
    details?: string;
    features?: string[];
    stock?: number;
    originalPrice?: number;
}
export interface ICart {
    _id: mongoose.Types.ObjectId;
    userEmail: string;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Cart: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default Cart;
//# sourceMappingURL=Cart.d.ts.map