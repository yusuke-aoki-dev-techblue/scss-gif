<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;

class PaymentController extends Controller
{
    /**
     * LINE Pay Channel ID
     */
    const CHANNEL_ID = '1654198252';

    /**
     * シークレットID
     */
    const SECRET_KEY = '735a5555afea92bce5bddd3ae607e188';

    /**
     * Laravelのローカル実行時（artisan serve）のルートURL
     */
    const LOCAL_URL = 'http://127.0.0.1:8000/';

    /**
     * LINE Pay API のルートURL
     */
    const LINE_PAY_API_ROUTE_URI = 'https://api-pay.line.me';

    /**
     * Request API の URI
     */
    const REQUEST_URI = '/v3/payments/request';

    /**
     * Confirm API の URI <br>
     * use ex.CONFIRM_URI.$transactionId.'/confirm'
     */
    const CONFIRM_URI = '/v3/payments/';

    /**
     * 決済リクエストAPIの実行
     * @return String ユーザ決済用URL
     */
    public function requestApiExec(){
        $postData = array(
            'amount' => 100,
            'currency' => 'JPY',
            'orderId' => date('YmdHis'),
            'packages' => [
                [
                    'id' => 'HOGE_CHOCO',
                    'amount' => 100,
                    'name' => 'ほげチョコ',
                    'products' => [
                        [
                            'name' => 'ほげチョコ',
                            'quantity' => 1,
                            'price' => 100,
                        ],
                    ],
                ],
            ],
            'redirectUrls' => [
                'confirmUrl' => self::LOCAL_URL.'payment/confirm',
                'cancelUrl' => self::LOCAL_URL.'cancel',
            ],
        );

        $rs = $this->curlConnectionExec(self::LINE_PAY_API_ROUTE_URI.self::REQUEST_URI,$postData,self::REQUEST_URI);

        return redirect()->away($rs['info']['paymentUrl']['web']);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Contracts\Foundation\Application|\Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function confirmApiExec(Request $request){
        $transactionId = $request->input('transactionId');
        $orderId = $request->input('orderId');

        $postData = array(
            'amount' => 100,
            'currency' => 'JPY'
        );

        $url = self::LINE_PAY_API_ROUTE_URI.self::CONFIRM_URI.$transactionId.'/confirm';
        $requestUri = self::CONFIRM_URI.$transactionId.'/confirm';

        $rs = $this->curlConnectionExec($url,$postData,$requestUri);

        $returnData = array(
            'orderId' => $orderId,
            'resultCode' => $rs['returnCode']
        );

        return view('finish')->with($returnData);
    }

    /**
     * LINE Pay APIを実行するためのHeaderを作成します
     * @param array $postDataArray POSTするデータ配列
     * @param string $url
     * @return string[] 含めるHEADERデータ配列
     */
    private function createHeader(array $postDataArray, string $url){
        $nonce = (string)Uuid::uuid4();
        $signature = (string)base64_encode(hash_hmac('sha256',(self::SECRET_KEY.$url.json_encode($postDataArray).$nonce),self::SECRET_KEY,true));

        return array(
            'Content-Type: application/json',
            'X-LINE-ChannelId: '.self::CHANNEL_ID,
            'X-LINE-Authorization-Nonce: '.$nonce ,
            'X-LINE-Authorization: '.$signature
        );
    }

    /**
     * curlで通信を確立し、結果の配列を返します
     * @param string $url アクセスするAPIのアドレス
     * @param array $postData POSTするデータ
     * @param string $apiUri アクセスするAPIのルート以下のURI
     * @return array $rs 実行結果配列
     */
    private function curlConnectionExec(string $url, array $postData, string $apiUri){
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSLVERSION, 1);
        curl_setopt($ch, CURLOPT_SSL_CIPHER_LIST, 'TLSv1');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->createHeader($postData,$apiUri));
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        $rs = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return $rs;
    }
}
