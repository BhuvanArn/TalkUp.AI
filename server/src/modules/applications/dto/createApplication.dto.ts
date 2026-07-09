import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

@ApiSchema({
  name: "CreateApplicationRequest",
  description:
    "Public URL of a job-offer page; TalkUp scrapes it and creates an application",
})
export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @ApiProperty({
    description: "URL of the job offer to scrape and analyze",
    example: "https://www.linkedin.com/jobs/view/1234567890",
  })
  url: string;
}
