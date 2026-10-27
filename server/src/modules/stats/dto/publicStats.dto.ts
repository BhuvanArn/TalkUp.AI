import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
  name: "PublicStatsDto",
  description: "Aggregate, non-identifying platform statistics",
})
export class PublicStatsDto {
  @ApiProperty({
    description: "Number of accounts with a verified email address.",
    example: 1234,
  })
  totalAccounts: number;
}
