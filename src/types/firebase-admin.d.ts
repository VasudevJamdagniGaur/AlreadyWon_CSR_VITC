declare module "firebase-admin" {
  const admin: any;
  export = admin;
}

declare module "firebase-admin/app" {
  export const initializeApp: any;
  export const getApps: any;
  export const cert: any;
}

declare module "firebase-admin/firestore" {
  export const getFirestore: any;
}
