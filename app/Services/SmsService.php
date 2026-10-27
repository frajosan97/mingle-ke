<?php

namespace App\Services;

use App\Models\Message;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SmsService
{
    protected Client $client;
    protected string $apiBaseUrl;
    protected ?string $apiKey;
    protected ?string $partnerId;
    protected ?string $senderId;

    public function __construct()
    {
        $this->apiKey = config('services.sms.api_key');
        $this->partnerId = config('services.sms.partner_id');
        $this->senderId = config('services.sms.sender_id');
        $this->apiBaseUrl = rtrim((string) config('services.sms.base_url'), '/');

        $this->client = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'verify' => app()->environment('production'),
        ]);
    }

    public function sendSms(
        string $mobile,
        string $message,
        ?string $scheduleTime = null,
        ?string $clientSmsId = null
    ): array|bool {
        $this->validateInput($mobile, $message, $scheduleTime, $clientSmsId);

        $payload = array_filter([
            'apikey' => $this->apiKey,
            'partnerID' => $this->partnerId,
            'message' => $message,
            'shortcode' => $this->senderId,
            'mobile' => formatPhoneNumber($mobile),
            'timeToSend' => $scheduleTime,
            'clientsmsid' => $clientSmsId,
        ]);

        $response = $this->post('/api/services/sendsms', $payload);
        $responseInfo = $response['responses'][0] ?? null;

        if (!$responseInfo) {
            return false;
        }

        $this->saveMessage($responseInfo, $mobile, $message, $clientSmsId);

        return $responseInfo;
    }

    protected function post(string $endpoint, array $payload): array
    {
        try {
            $res = $this->client->post("{$this->apiBaseUrl}{$endpoint}", [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            return json_decode($res->getBody()->getContents(), true) ?? [];
        } catch (RequestException $e) {
            Log::error('SMS send failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    protected function validateInput(
        string $mobile,
        string $message,
        ?string $scheduleTime,
        ?string $clientSmsId
    ): void {
        $validator = Validator::make([
            'mobile' => $mobile,
            'message' => $message,
            'scheduleTime' => $scheduleTime,
            'clientSmsId' => $clientSmsId,
        ], [
            'mobile' => ['required', 'string'],
            'message' => ['required', 'string'],
            'scheduleTime' => ['nullable', 'date_format:Y-m-d H:i', 'after_or_equal:now'],
            'clientSmsId' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    protected function saveMessage(
        array $responseInfo,
        string $mobile,
        string $message,
        ?string $clientSmsId
    ): void {
        $data = [
            'mobile' => $responseInfo['mobile'] ?? $mobile,
            'message' => $message,
            'response_code' => $responseInfo['response-code'] ?? null,
            'response_description' => $responseInfo['response-description'] ?? null,
        ];

        if (($responseInfo['response-code'] ?? null) === 200) {
            $data['network_id'] = $responseInfo['networkid'] ?? null;

            if (!empty($responseInfo['messageid'])) {
                Message::updateOrCreate(
                    ['message_id' => $responseInfo['messageid']],
                    $data
                );
                return;
            }

            $data['message_id'] = $clientSmsId ?? uniqid('msg_', true);
        }

        Message::create($data);
    }
}