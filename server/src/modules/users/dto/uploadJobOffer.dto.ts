import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

@ApiSchema({
  name: "UploadJobOfferRequest",
  description: "Public URL of a job-offer page to extract structured data from",
})
export class UploadJobOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @ApiProperty({
    description: "URL of the job offer to scrape and analyze",
    example: "https://www.linkedin.com/jobs/view/1234567890",
  })
  url: string;
}
