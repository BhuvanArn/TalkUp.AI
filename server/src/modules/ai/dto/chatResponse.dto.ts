import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
  name: "ChatResponseDto",
  description: "The assistant's reply to a chatbot message.",
})
export class ChatResponseDto {
  @ApiProperty({ description: "The assistant's generated reply." })
  reply: string;
}
