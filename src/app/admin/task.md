# WebSocket Real-Time Admin Panel

## Backend
- [ ] Add `spring-boot-starter-websocket` to pom.xml
- [ ] Create `WebSocketConfig.java`
- [ ] Create `AdminEventPublisher.java`
- [ ] Create `AdminScheduler.java`
- [ ] Modify `SecurityConfig.java` — permit /ws/**
- [ ] Modify `AdminPanelService.java` — publish after role update
- [ ] Modify `OAuth2LoginSuccessHandler.java` — publish after login
- [ ] Modify `VisualItemService.java` — publish after upload/delete

## Frontend
- [ ] Install @stomp/stompjs and sockjs-client
- [ ] Create `useAdminWebSocket.ts` hook
- [ ] Modify `AdminWorkspace.tsx` — consume WS hook + live indicator
- [ ] Modify `AdminUsers.tsx` — accept external user list

## Verify
- [ ] mvn compile
- [ ] Restart Spring Boot
- [ ] Test live indicator + realtime updates
