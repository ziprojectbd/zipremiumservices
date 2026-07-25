import mongoose from 'mongoose';
export interface IKYC {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    email: string;
    fullName: string;
    phone: string;
    nidNumber: string;
    dateOfBirth: string;
    country: string;
    address: string;
    district: string;
    upazila: string;
    city: string;
    postCode: string;
    nidFront: string;
    nidBack: string;
    selfieImage: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const KYC: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default KYC;
//# sourceMappingURL=KYC.d.ts.map