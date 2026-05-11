// /**
//  * Public API for the authentication system
//  *
//  * This module provides a clean public API for OAuth2/OIDC authentication
//  * using angular-oauth2-oidc with environment-agnostic configuration.
//  *
//  * Core Features:
//  * - Environment-agnostic OAuth2/OIDC configuration
//  * - NgRx Signal Store for reactive state management
//  * - Comprehensive authentication service
//  * - Token management and automatic refresh
//  * - Role-based access control (RBAC)
//  * - Type-safe user profile management
//  */
//
// // Configuration Types and Interfaces
// export type {
//   OAuth2Config,
//   UserProfile,
//   AuthState,
//   AuthEvents,
//   EnvironmentType,
//   ConfigValidationResult,
//   TokenRefreshConfig,
//   ProviderSpecificConfig
// } from './config/auth-config.interface';
//
// export {
//   AUTH_CONFIG_CONSTANTS
// } from './config/auth-config.interface';
//
// // Configuration Service
// export {
//   AuthConfigService
// } from './config/auth-config.service';
//
// // Environment Configurations
// export {
//   authConfigLocal,
//   validateDevConfig,
//   devAuthUtils
// } from './config/environment/auth.config.local';
//
// export {
//   authConfigInt,
//   validateIntConfig,
//   intAuthUtils
// } from './config/environment/auth-config.int';
//
// export {
//   authConfigProd,
//   validateProdConfig,
//   prodAuthUtils
// } from './config/environment/auth.config.prod';
//
// // Authentication Service
// export {
//   AuthService
// } from './services/auth.service';
//
// // Authentication Store
// export {
//   AuthStore,
//   injectAuthStore
// } from './store/auth.store';
//
// // Authentication Guards
// export {
//   waitForAuthGuard
// } from './guards/auth.guard';
//
//
//
// // Authentication UI Components
// export {
//   LogoutButtonComponent,
//   LogoutConfirmationDialogComponent
// } from './components/logout-button/logout-button';
//
// export {
//   UserProfileComponent
// } from './components/user-profile/user-profile';
//
// export {
//   AuthStatusComponent
// } from './components/auth-status/auth-status';
//
// /**
//  * Re-export commonly used types from angular-oauth2-oidc
//  * for convenience and consistency
//  */
// export type {
//   AuthConfig,
//   OAuthEvent,
//   OAuthInfoEvent,
//   OAuthErrorEvent,
//   OAuthSuccessEvent
// } from 'angular-oauth2-oidc';
//
