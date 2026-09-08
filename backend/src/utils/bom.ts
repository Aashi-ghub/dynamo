/**
 * Some legacy/externally-written DynamoDB records store attribute names without the
 * leading byte-order-mark this app's fieldMap expects (e.g. plain "Subscription ID"
 * instead of "﻿Subscription ID"), which would otherwise silently drop that field.
 */
export const stripBom = (field: string) => (field.charCodeAt(0) === 0xfeff ? field.slice(1) : field);
