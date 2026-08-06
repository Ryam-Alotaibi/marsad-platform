import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@CurrentUser() user: RequestUser) {
    return this.chatService.createConversation(user.tenantId, user.id);
  }

  @Get('conversations/:id/messages')
  getMessages(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chatService.getMessages(user.tenantId, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      user.tenantId,
      user.id,
      id,
      dto.content,
    );
  }

  @Get('composite-alerts')
  getCompositeAlerts(@CurrentUser() user: RequestUser) {
    return this.chatService.getCompositeAlerts(user.tenantId);
  }
}
