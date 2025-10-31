/**
 * Auth Routes - 认证路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(authController.getMe));

/**
 * @route   PATCH /api/auth/me
 * @desc    更新当前用户信息
 * @access  Private
 */
router.patch('/me', authenticate, asyncHandler(authController.updateMe));

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;

