// backend/genhash.go
package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	pw := "Test1234!"
	hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	fmt.Println(string(hash))
}
