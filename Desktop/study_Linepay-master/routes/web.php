<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

/*Route::get('/', function () {
    return view('welcome');
}*/

/**
 * ルート
 */
Route::get('/', function () {
    return view('payment');
});

/**
 * 決済キャンセル
 */
Route::get('payment/cancel', function () {
    return view('cancel');
});

/**
 * 決済実行
 */
Route::get('payment/request','PaymentController@requestApiExec')->name('payment.request');

/**
 * 決済確定
 */
Route::get('payment/confirm','PaymentController@confirmApiExec')->name('payment.confirm');
