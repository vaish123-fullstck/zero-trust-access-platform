package awssts

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

type Service struct {
	sts    *sts.Client
	region string
}

// NewService loads default AWS config (from env, IAM role, etc.).
func NewService(ctx context.Context) (*Service, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-south-1"
	}

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	return &Service{
		sts:    sts.NewFromConfig(cfg),
		region: region,
	}, nil
}

// AssumeRoleAndConsoleURL assumes the given role ARN and returns a console sign-in URL.
func (s *Service) AssumeRoleAndConsoleURL(
	ctx context.Context,
	roleARN string,
	sessionName string,
	durationSeconds int32,
) (string, error) {
	if durationSeconds <= 0 {
		durationSeconds = 3600
	}

	// 1) Call STS AssumeRole
	out, err := s.sts.AssumeRole(ctx, &sts.AssumeRoleInput{
		RoleArn:         aws.String(roleARN),
		RoleSessionName: aws.String(sessionName),
		DurationSeconds: aws.Int32(durationSeconds),
	})
	if err != nil {
		return "", err
	}

	creds := out.Credentials
	if creds == nil {
		return "", fmt.Errorf("assume role returned no credentials")
	}

	// 2) Build a JSON session object for federation endpoint
	sessionJSON, err := json.Marshal(map[string]string{
		"sessionId":    aws.ToString(creds.AccessKeyId),
		"sessionKey":   aws.ToString(creds.SecretAccessKey),
		"sessionToken": aws.ToString(creds.SessionToken),
	})
	if err != nil {
		return "", err
	}

	// 3) Call federation endpoint to get a sign-in token
	signinURL := "https://signin.aws.amazon.com/federation"
	getTokenURL := fmt.Sprintf(
		"%s?Action=getSigninToken&SessionType=json&Session=%s",
		signinURL,
		url.QueryEscape(string(sessionJSON)),
	)

	resp, err := http.Get(getTokenURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var tokenResp struct {
		SigninToken string `json:"SigninToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}
	if tokenResp.SigninToken == "" {
		return "", fmt.Errorf("empty SigninToken from federation endpoint")
	}

	// 4) Build final console URL
	dest := "https://console.aws.amazon.com/"
	issuer := "https://zero-trust-console.local"

	loginURL := fmt.Sprintf(
		"%s?Action=login&Issuer=%s&Destination=%s&SigninToken=%s",
		signinURL,
		url.QueryEscape(issuer),
		url.QueryEscape(dest),
		url.QueryEscape(tokenResp.SigninToken),
	)

	return loginURL, nil
}
