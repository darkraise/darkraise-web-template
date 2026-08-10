import { useEffect, useState } from "react"
import { Upload, X } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "darkraise-ui/components/avatar"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadHiddenInput,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadItemSizeText,
  FileUploadLabel,
  FileUploadTrigger,
} from "darkraise-ui/components/file-upload"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import { Textarea } from "darkraise-ui/components/textarea"
import { FormSection } from "darkraise-ui/forms"

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function ProfileSection() {
  const [avatarFiles, setAvatarFiles] = useState<File[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [displayName, setDisplayName] = useState("Alex Johnson")
  const [email, setEmail] = useState("alex.johnson@example.com")
  const [bio, setBio] = useState(
    "Product designer focused on building accessible, delightful interfaces.",
  )

  useEffect(() => {
    const file = avatarFiles[0]
    if (!file) {
      setAvatarUrl(undefined)
      return
    }
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFiles])

  return (
    <FormSection
      title="Profile"
      description="This information is displayed publicly, so be careful what you share."
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xl">
                {initialsOf(displayName) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <FileUpload
                acceptedFiles={avatarFiles}
                onFileChange={(d) => setAvatarFiles(d.acceptedFiles)}
                accept="image/*"
                multiple={false}
                maxFiles={1}
              >
                <FileUploadLabel>Profile picture</FileUploadLabel>
                <FileUploadDropzone>
                  <Upload className="text-muted-foreground h-6 w-6" />
                  <p className="text-muted-foreground text-sm">
                    Drop an image here or
                  </p>
                  <FileUploadTrigger>Change picture</FileUploadTrigger>
                  <FileUploadHiddenInput />
                </FileUploadDropzone>
                <FileUploadItemGroup>
                  {avatarFiles.map((file) => (
                    <FileUploadItem
                      key={`${file.name}-${file.size}`}
                      file={file}
                    >
                      <FileUploadItemName />
                      <FileUploadItemSizeText />
                      <FileUploadItemDeleteTrigger>
                        <X className="h-4 w-4" />
                      </FileUploadItemDeleteTrigger>
                    </FileUploadItem>
                  ))}
                </FileUploadItemGroup>
              </FileUpload>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-display-name">Display name</Label>
              <Input
                id="profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>
        </CardContent>
      </Card>
    </FormSection>
  )
}
