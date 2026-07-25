import mongoose from 'mongoose';
export interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin' | 'customer' | 'trader';
    status: 'active' | 'inactive' | 'suspended';
    image?: string | null;
    isTrader: boolean;
    kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
    totalSpent?: number;
    totalOrders?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const User: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default User;
//# sourceMappingURL=User.d.ts.map