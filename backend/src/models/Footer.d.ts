import mongoose from 'mongoose';
interface FooterLink {
    name: string;
    href: string;
}
interface FooterSection {
    title: string;
    color: string;
    hoverColor: string;
    links: FooterLink[];
}
interface FooterDocument extends mongoose.Document {
    sections: FooterSection[];
    createdAt: Date;
    updatedAt: Date;
}
declare const FooterModel: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<FooterDocument, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, FooterDocument, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<FooterDocument, mongoose.Model<FooterDocument, any, any, any, any, any, FooterDocument>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, FooterDocument, mongoose.Document<unknown, {}, FooterDocument, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: mongoose.SchemaDefinitionProperty<mongoose.Types.ObjectId, FooterDocument, mongoose.Document<unknown, {}, FooterDocument, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    sections?: mongoose.SchemaDefinitionProperty<FooterSection[], FooterDocument, mongoose.Document<unknown, {}, FooterDocument, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    createdAt?: mongoose.SchemaDefinitionProperty<Date, FooterDocument, mongoose.Document<unknown, {}, FooterDocument, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    updatedAt?: mongoose.SchemaDefinitionProperty<Date, FooterDocument, mongoose.Document<unknown, {}, FooterDocument, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<FooterDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
}, FooterDocument>, FooterDocument>;
export default FooterModel;
//# sourceMappingURL=Footer.d.ts.map