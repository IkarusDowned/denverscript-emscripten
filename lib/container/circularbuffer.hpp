// This is not production ready code. It is made only for the purposes of the sample at hand.
#pragma once
#include <vector>

template <typename T>
class CircularBuffer
{

private:
    static const unsigned int MIN_BUFFER_SIZE = 1;
    const unsigned int capacity;
    std::vector<T> buffer;
    unsigned int tail;
    unsigned int head;
    unsigned int size;

public:
    class Iterator
    {
    private:
        const CircularBuffer *circularBuffer;
        unsigned int index;
        unsigned int remaining;

    public:
        explicit Iterator(const CircularBuffer *circularBuffer, unsigned int index, unsigned int remaining)
            : circularBuffer(circularBuffer), index(index), remaining(remaining)
        {
        }
        const T &operator*() const
        {
            return this->circularBuffer->buffer[index];
        }
        Iterator &operator++()
        {
            if (this->remaining > 0)
            {
                this->index = (this->index + 1) % this->circularBuffer->capacity;
                --this->remaining;
            }
            return *this;
        }
        bool operator!=(const Iterator &other) const { return this->remaining != other.remaining; }
    };

    explicit CircularBuffer(unsigned int capacity)
        : capacity(capacity > MIN_BUFFER_SIZE ? capacity : MIN_BUFFER_SIZE), buffer(capacity), tail(0), head(0), size(0)
    {
    }

    void enqueue(const T &item)
    {
        this->buffer[this->tail] = item;
        this->tail = (this->tail + 1) % this->capacity;
        if (this->size < this->capacity)
        {
            ++(this->size);
        }
        else
        {
            this->head = (this->head + 1) % this->capacity;
        }
    }

    T *peek()
    {
        if (this->size == 0)
        {
            return nullptr;
        }
        const unsigned int lastIndex = (this->tail - 1 + this->capacity) % this->capacity;
        return &(this->buffer[lastIndex]);
    }

    Iterator begin() const
    {
        return Iterator(this, this->head, this->size);
    }

    Iterator end() const
    {
        return Iterator(this, this->tail, 0);
    }
};