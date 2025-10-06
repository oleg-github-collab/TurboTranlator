package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Storage implements Provider using AWS S3 or compatible services.
type S3Storage struct {
	client *s3.Client
	bucket string
}

// NewS3Storage constructs the storage provider.
func NewS3Storage(ctx context.Context, endpoint, region, bucket, accessKey, secretKey string) (*S3Storage, error) {
	var loadOptions []func(*config.LoadOptions) error
	if accessKey != "" && secretKey != "" {
		credentialsProvider := credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")
		loadOptions = append(loadOptions, config.WithCredentialsProvider(credentialsProvider))
	}
	if region != "" {
		loadOptions = append(loadOptions, config.WithRegion(region))
	}
	if endpoint != "" {
		loadOptions = append(loadOptions, config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, _ ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: endpoint, Region: region, SigningRegion: region, HostnameImmutable: true}, nil
			},
		)))
	}

	cfg, err := config.LoadDefaultConfig(ctx, loadOptions...)
	if err != nil {
		return nil, err
	}
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if endpoint != "" {
			o.UsePathStyle = true
		}
	})

	s := &S3Storage{client: client, bucket: bucket}
	if err := s.ensureBucket(ctx); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *S3Storage) ensureBucket(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(s.bucket)})
	if err == nil {
		return nil
	}
	var notFound *s3types.NotFound
	if errorAs(err, &notFound) {
		_, createErr := s.client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(s.bucket)})
		return createErr
	}
	return err
}

// Save uploads object to bucket.
func (s *S3Storage) Save(ctx context.Context, key string, reader io.Reader, contentType string) error {
	uploader := manager.NewUploader(s.client)
	_, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	return err
}

// Get downloads object from bucket.
func (s *S3Storage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	resp, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	return resp.Body, nil
}

// Delete removes object from bucket.
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

// SignedURL returns a presigned URL for downloading.
func (s *S3Storage) SignedURL(ctx context.Context, key string, expirySeconds int) (string, error) {
	presigner := s3.NewPresignClient(s.client)
	resp, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(expirySeconds) * time.Second
	})
	if err != nil {
		return "", err
	}
	return resp.URL, nil
}

func errorAs(err error, target interface{}) bool {
	return aws.As(err, target)
}

// BuildS3PublicURL returns https URL for bucket if accessible.
func (s *S3Storage) BuildS3PublicURL(key string) (string, error) {
	u := &url.URL{
		Scheme: "https",
		Host:   fmt.Sprintf("%s.s3.amazonaws.com", s.bucket),
		Path:   key,
	}
	return u.String(), nil
}
