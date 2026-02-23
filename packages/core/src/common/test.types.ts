
// import { z } from "zod";
// import { InferZ, ZodAny } from "../types/route";

// const Schema = z;

// const authService = {
//     verify: (token: string) => {
//         return { userId: "123" };
//     },
// };

// // --- PROPOSED DEFINITIONS ---

// export function testCreateGateway<
//     Services extends Record<string, unknown>,
//     const T extends readonly { event: string; schema?: unknown }[]
// >(config: {
//     inject?: Services;
//     events: {
//         [K in keyof T]: {
//             event: T[K]["event"];
//             schema?: T[K]["schema"];
//             handler: (ctx: {
//                 client: any;
//                 data: T[K]["schema"] extends ZodAny ? InferZ<T[K]["schema"]> : unknown
//             } & Services) => any
//         }
//     }
// }) {
//     return config as any;
// }

// // --- TEST ---

// export const testGateway = testCreateGateway({
//     inject: { authService },
//     events: [
//         {
//             event: "message",
//             schema: Schema.object({
//                 text: Schema.string(),
//             }),
//             handler: ({ client, data, authService }) => {
//                 // data.text should be string
//                 const text = data.text;

//                 // This should ERROR if strictly typed
//                 // @ts-expect-error
//                 const fail = data.random;

//                 authService.verify("ok");
//             },
//         }
//     ],
// });
