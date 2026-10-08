<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $tokenHash = $token ? hash('sha256', $token) : null;
        $apiToken = $tokenHash ? ApiToken::where('token_hash', $tokenHash)->first() : null;
        $user = $apiToken?->user
            ?? ($tokenHash ? User::where('api_token', $tokenHash)->first() : null);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('api_token_hash', $tokenHash);

        return $next($request);
    }
}
