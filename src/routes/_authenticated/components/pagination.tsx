import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/core/components/ui/pagination"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/pagination")({
  component: PaginationPage,
})

function PaginationPage() {
  const [page, setPage] = useState(3)

  return (
    <ShowcasePage
      title="Pagination"
      description="Navigation controls for paginated content."
    >
      <ShowcaseExample
        title="Basic pagination with numbered links"
        code={`const [page, setPage] = useState(3)

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" onClick={() => setPage(p => Math.max(1, p - 1))} />
    </PaginationItem>
    {[1, 2, 3, 4, 5].map((p) => (
      <PaginationItem key={p}>
        <PaginationLink href="#" isActive={p === page} onClick={() => setPage(p)}>
          {p}
        </PaginationLink>
      </PaginationItem>
    ))}
    <PaginationItem>
      <PaginationNext href="#" onClick={() => setPage(p => Math.min(5, p + 1))} />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
              />
            </PaginationItem>
            {[1, 2, 3, 4, 5].map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(p)
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(5, p + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ShowcaseExample>

      <ShowcaseExample
        title="Pagination with ellipsis"
        code={`<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="#">8</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#">9</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#">10</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationLink href="#">20</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent>
</Pagination>`}
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => e.preventDefault()}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(e) => e.preventDefault()}
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                8
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                9
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                10
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                20
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => e.preventDefault()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ShowcaseExample>

      <ShowcaseExample
        title="Compact pagination — previous/next only"
        code={`<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => e.preventDefault()}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => e.preventDefault()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
