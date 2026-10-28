<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDeviceStatusRequest;
use App\Services\PresenceService;
use Illuminate\Http\JsonResponse;

class DeviceStatusController extends Controller
{
    public function __construct(
        private readonly PresenceService $presence,
    ) {
    }

    public function update(UpdateDeviceStatusRequest $request): JsonResponse
    {
        $isOnline = $request->isOnline();

        $this->presence->mark($request->user(), $isOnline);

        return response()->json([
            'success' => true,
            'is_online' => $isOnline,
        ]);
    }
}