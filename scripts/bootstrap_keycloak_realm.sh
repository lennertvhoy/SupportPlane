#!/bin/bash
set -euo pipefail

# SupportPlane Keycloak Realm Bootstrap
# Local sandbox only. Not production hardened.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://127.0.0.1:18082}"
ADMIN_USERNAME="${KEYCLOAK_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-keycloak-local-admin-password}"
REALM_NAME="supportplane-local"
CLIENT_ID="supportplane-web"
CLIENT_SECRET="${OIDC_CLIENT_SECRET:-supportplane-web-local-secret}"

REQUIRED_USERS=(
  "oidc-admin:oidc-admin@supportplane.local:admin"
  "oidc-operator:oidc-operator@supportplane.local:operator"
  "oidc-viewer:oidc-viewer@supportplane.local:viewer"
)

echo "=== SupportPlane Keycloak Realm Bootstrap ==="
echo "Keycloak URL: $KEYCLOAK_BASE_URL"
echo "Realm: $REALM_NAME"
echo

# Obtain admin token
echo "Obtaining admin token..."
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST "${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USERNAME}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ADMIN_TOKEN=$(echo "$ADMIN_TOKEN_RESPONSE" | jq -r '.access_token // empty')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "ERROR: Failed to obtain admin token. Response:"
  echo "$ADMIN_TOKEN_RESPONSE" | jq . 2>/dev/null || echo "$ADMIN_TOKEN_RESPONSE"
  exit 1
fi

echo "Admin token obtained."
echo

# Create or update realm
echo "Creating realm: $REALM_NAME..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

if [ "$REALM_EXISTS" = "200" ]; then
  echo "Realm already exists. Skipping creation."
else
  curl -s -o /dev/null -w "%{http_code}" -X POST "${KEYCLOAK_BASE_URL}/admin/realms" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"${REALM_NAME}\",
      \"realm\": \"${REALM_NAME}\",
      \"enabled\": true,
      \"displayName\": \"SupportPlane Local Sandbox\",
      \"sslRequired\": \"none\",
      \"registrationAllowed\": false,
      \"loginWithEmailAllowed\": true,
      \"duplicateEmailsAllowed\": false,
      \"resetPasswordAllowed\": false,
      \"editUsernameAllowed\": false,
      \"bruteForceProtected\": false
    }"
  echo "Realm created."
fi
echo

# Create client
echo "Creating client: $CLIENT_ID..."
CLIENT_UUID=$(curl -s "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
  echo "Client already exists (UUID: ${CLIENT_UUID}). Updating..."
  curl -s -o /dev/null -X PUT "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${CLIENT_ID}\",
      \"name\": \"SupportPlane Web\",
      \"description\": \"Local sandbox OIDC client\",
      \"enabled\": true,
      \"clientAuthenticatorType\": \"client-secret\",
      \"secret\": \"${CLIENT_SECRET}\",
      \"redirectUris\": [\"http://localhost:4210/auth/oidc/callback\", \"http://localhost:3300/auth/oidc/callback\"],
      \"webOrigins\": [\"http://localhost:4210\", \"http://localhost:3300\"],
      \"standardFlowEnabled\": true,
      \"implicitFlowEnabled\": false,
      \"directAccessGrantsEnabled\": true,
      \"serviceAccountsEnabled\": false,
      \"publicClient\": false,
      \"protocol\": \"openid-connect\",
      \"attributes\": {\"pkce.code.challenge.method\": \"S256\"}
    }"
else
  curl -s -o /dev/null -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${CLIENT_ID}\",
      \"name\": \"SupportPlane Web\",
      \"description\": \"Local sandbox OIDC client\",
      \"enabled\": true,
      \"clientAuthenticatorType\": \"client-secret\",
      \"secret\": \"${CLIENT_SECRET}\",
      \"redirectUris\": [\"http://localhost:4210/auth/oidc/callback\", \"http://localhost:3300/auth/oidc/callback\"],
      \"webOrigins\": [\"http://localhost:4210\", \"http://localhost:3300\"],
      \"standardFlowEnabled\": true,
      \"implicitFlowEnabled\": false,
      \"directAccessGrantsEnabled\": true,
      \"serviceAccountsEnabled\": false,
      \"publicClient\": false,
      \"protocol\": \"openid-connect\",
      \"attributes\": {\"pkce.code.challenge.method\": \"S256\"}
    }"
  echo "Client created."
fi
echo

# Create roles
echo "Creating roles..."
for ROLE in admin operator viewer; do
  ROLE_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/roles/${ROLE}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
  if [ "$ROLE_EXISTS" = "404" ]; then
    curl -s -o /dev/null -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/roles" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"${ROLE}\", \"description\": \"SupportPlane ${ROLE} role\"}"
    echo "Role '${ROLE}' created."
  else
    echo "Role '${ROLE}' already exists."
  fi
done
echo

# Create users
echo "Creating users..."
for USER_SPEC in "${REQUIRED_USERS[@]}"; do
  IFS=':' read -r USERNAME EMAIL ROLE <<< "$USER_SPEC"
  PASSWORD="supportplane-oidc-demo"

  USER_UUID=$(curl -s "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users?username=${USERNAME}&exact=true" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

  if [ -n "$USER_UUID" ] && [ "$USER_UUID" != "null" ]; then
    echo "User '${USERNAME}' already exists (UUID: ${USER_UUID}). Updating password and role..."
    # Reset password
    curl -s -o /dev/null -X PUT "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users/${USER_UUID}/reset-password" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"type\": \"password\", \"value\": \"${PASSWORD}\", \"temporary\": false}"
  else
    CREATE_RESPONSE=$(curl -s -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"${USERNAME}\",
        \"enabled\": true,
        \"email\": \"${EMAIL}\",
        \"firstName\": \"OIDC\",
        \"lastName\": \"$(echo "$ROLE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')\",
        \"credentials\": [{\"type\": \"password\", \"value\": \"${PASSWORD}\", \"temporary\": false}]
      }" -w "\n%{http_code}")
    HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
    if [ "$HTTP_CODE" = "201" ]; then
      echo "User '${USERNAME}' created."
    else
      echo "WARNING: Failed to create user '${USERNAME}'. HTTP ${HTTP_CODE}"
      continue
    fi
    USER_UUID=$(curl -s "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users?username=${USERNAME}&exact=true" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')
  fi

  # Assign role
  ROLE_REP=$(curl -s "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/roles/${ROLE}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
  ROLE_ID=$(echo "$ROLE_REP" | jq -r '.id // empty')
  if [ -n "$ROLE_ID" ] && [ "$ROLE_ID" != "null" ]; then
    curl -s -o /dev/null -X POST "${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users/${USER_UUID}/role-mappings/realm" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "[{\"id\": \"${ROLE_ID}\", \"name\": \"${ROLE}\"}]"
    echo "Role '${ROLE}' assigned to '${USERNAME}'."
  fi
done
echo

echo "=== Bootstrap Complete ==="
echo "Realm: ${REALM_NAME}"
echo "Client: ${CLIENT_ID}"
echo "Discovery: ${KEYCLOAK_BASE_URL}/realms/${REALM_NAME}/.well-known/openid-configuration"
echo "Users: oidc-admin (admin), oidc-operator (operator), oidc-viewer (viewer)"
echo "Password: supportplane-oidc-demo"
echo "Client secret: [REDACTED]"
echo
